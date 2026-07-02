import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db.js';
import authRouter from './routes/auth.js';
import dataRouter from './routes/data.js';
import storageRouter from './routes/storage.js';
import rpcRouter from './routes/rpc.js';
import notificationsRouter from './routes/notifications.js';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth',    authRouter);
app.use('/api/data',    dataRouter);
app.use('/api/storage', storageRouter);
app.use('/api/rpc',     rpcRouter);
app.use('/api/notifications', notificationsRouter);
app.get('/api/health',  (_req, res) => res.json({ ok: true }));

// ── Public catalog feed (NO AUTH) ────────────────────────────────────────────
// Powers the public marketing site's category grid. Returns ONLY public product
// base-names + their category (no prices, no portal-only items, no client data),
// read live from the admin-editable pricelist. Safe to expose unauthenticated.
app.get('/api/public/catalog', async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT value FROM app_settings WHERE key = 'pricelist'");
    const pricelists = rows[0] && rows[0].value;
    if (!pricelists || typeof pricelists !== 'object') return res.json({ products: [] });
    const tier = pricelists.standard || Object.values(pricelists)[0] || { products: [] };
    const out = [];
    const seen = new Set();
    for (const p of (tier.products || [])) {
      if (!p || p.public === false) continue;            // portal-only
      const base = String(p.name || '').split(/[—–]/)[0].trim();  // strip strength
      const key = base.toLowerCase();
      if (!base || seen.has(key)) continue;
      seen.add(key);
      out.push({ name: base, category: p.category || '' });
    }
    res.json({ products: out });
  } catch (err) {
    res.json({ products: [], error: err.message });      // never break the public page
  }
});
// ── Serve frontend pages ────────────────────────────────────────────────────
const PUBLIC_FILES = [
  'index.html',
  'Admin.html',
  'ClientPortal.html',
  'PeakFormBio.html',
  'api-client.js',
  'inventory-helper.js',
  'pricelists.js',
  'supabase-config.js',
];

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/assets',  express.static(path.join(__dirname, 'assets')));

app.get('/admin',    (_req, res) => res.sendFile(path.join(__dirname, 'public', 'Admin.html')));
app.get('/m',        (_req, res) => res.sendFile(path.join(__dirname, 'public', 'Admin-Mobile.html')));
app.get('/portal',   (_req, res) => res.sendFile(path.join(__dirname, 'public', 'ClientPortal.html')));
app.get('/groupbuy', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'groupbuy.html')));

app.get('/payment-config.js',        (_req, res) => res.sendFile(path.join(__dirname, 'public', 'payment-config.js')));
app.get('/payment-instructions.jsx', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'payment-instructions.jsx')));

// ── pfbgb.com — serve group buy page for the separate vendor domain ──────────
app.use((req, res, next) => {
  const host = (req.headers.host || req.hostname || '').replace(/:\d+$/, '');
  if (host === 'pfbgb.com' || host === 'www.pfbgb.com') {
    return res.sendFile(path.join(__dirname, 'public', 'groupbuy.html'));
  }
  next();
});
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

async function init() {
  console.log('Connecting to database...');
  let retries = 10;
  while (retries > 0) {
    try {
      await pool.query('SELECT 1');
      console.log('Database connected.');
      break;
    } catch (err) {
      retries--;
      console.log('DB not ready (' + retries + ' left): ' + err.message);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  if (retries === 0) {
    console.error('Could not connect to database. Exiting.');
    process.exit(1);
  }
  // ── Schema reconciliation ───────────────────────────────────────────────
  // The frontend uses FLAT plan columns, but older DBs / the Supabase migration
  // packed everything into a `content` jsonb blob. Add the flat columns if
  // missing and backfill from content. Idempotent — safe on every boot.
  try {
    await pool.query(`
      ALTER TABLE nutrition_plans
        ADD COLUMN IF NOT EXISTS title          text,
        ADD COLUMN IF NOT EXISTS goal           text,
        ADD COLUMN IF NOT EXISTS daily_calories integer,
        ADD COLUMN IF NOT EXISTS protein_g      integer,
        ADD COLUMN IF NOT EXISTS carbs_g        integer,
        ADD COLUMN IF NOT EXISTS fats_g         integer,
        ADD COLUMN IF NOT EXISTS plan_data      jsonb;

      UPDATE nutrition_plans SET
        title          = COALESCE(title, content->>'title', 'Nutrition Plan'),
        goal           = COALESCE(goal, content->>'goal'),
        daily_calories = COALESCE(daily_calories, NULLIF(content->>'daily_calories','')::int),
        protein_g      = COALESCE(protein_g, NULLIF(content->>'protein_g','')::int),
        carbs_g        = COALESCE(carbs_g, NULLIF(content->>'carbs_g','')::int),
        fats_g         = COALESCE(fats_g, NULLIF(content->>'fats_g','')::int),
        plan_data      = COALESCE(plan_data, content->'plan')
      WHERE content IS NOT NULL AND content::text <> '{}';

      ALTER TABLE workout_plans
        ADD COLUMN IF NOT EXISTS title       text,
        ADD COLUMN IF NOT EXISTS goal        text,
        ADD COLUMN IF NOT EXISTS limitations text,
        ADD COLUMN IF NOT EXISTS plan_data   jsonb;

      UPDATE workout_plans SET
        title       = COALESCE(title, content->>'title', 'Workout Plan'),
        goal        = COALESCE(goal, content->>'goal'),
        limitations = COALESCE(limitations, content->>'limitations'),
        plan_data   = COALESCE(plan_data, content->'plan')
      WHERE content IS NOT NULL AND content::text <> '{}';

      ALTER TABLE plan_templates
        ADD COLUMN IF NOT EXISTS plan_data jsonb,
        ADD COLUMN IF NOT EXISTS meta      jsonb;

      UPDATE plan_templates SET
        meta      = COALESCE(meta, content->'_meta'),
        plan_data = COALESCE(plan_data, content - '_meta')
      WHERE content IS NOT NULL AND content::text <> '{}';
    `);
    console.log('Schema reconciled (flat plan columns ensured).');
  } catch (err) {
    console.error('Schema reconciliation warning:', err.message);
  }

  // ── Payments editor table ────────────────────────────────────────────────
  // Run as its OWN statement so it ALWAYS executes, even if the big schema
  // block above errors on this particular database. This is what the
  // Admin → Payments panel reads/writes (key = 'payment_methods').
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS app_settings (
      key        TEXT PRIMARY KEY,
      value      JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );`);
    await pool.query(`INSERT INTO app_settings (key, value) VALUES ('payment_methods', '[]'::jsonb) ON CONFLICT (key) DO NOTHING;`);
    console.log('app_settings table ensured.');
  } catch (err) {
    console.error('app_settings setup error:', err.message);
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    const hash = await bcrypt.hash(adminPassword, 12);
    await pool.query(
      'INSERT INTO admins (email, password_hash) VALUES ($1, $2) ON CONFLICT (email) DO UPDATE SET password_hash = $2',
      [adminEmail.trim().toLowerCase(), hash]
    );
    console.log('Admin account ensured for: ' + adminEmail);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log('Server listening on 0.0.0.0:' + PORT);
  });
}

init().catch(err => {
  console.error('Startup error:', err);
  process.exit(1);
});
