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
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── API routes (mounted BEFORE static so /api/* takes priority) ──────────────
app.use('/api/auth',    authRouter);
app.use('/api/data',    dataRouter);
app.use('/api/storage', storageRouter);
app.use('/api/rpc',     rpcRouter);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// ── Static frontend (NEW: serves index.html / ClientPortal.html / Admin.html
//    plus all .jsx, .js, .css, /assets from /app/public). ─────────────────────
const PUBLIC_DIR = path.join(__dirname, 'public');
app.use(express.static(PUBLIC_DIR));

// ── User uploads (NEW: persistent volume mounted at /app/uploads) ────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Wait for DB and seed admin on startup
async function init() {
  let retries = 10;
  while (retries > 0) {
    try {
      await pool.query('SELECT 1');
      console.log('Database connected.');
      break;
    } catch (err) {
      retries--;
      console.log(`DB not ready, retrying in 3s... (${retries} left)`);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  if (retries === 0) {
    console.error('Could not connect to database. Exiting.');
    process.exit(1);
  }

  // Seed default admin if credentials are set in env
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    const hash = await bcrypt.hash(adminPassword, 12);
    await pool.query(
      `INSERT INTO admins (email, password_hash)
       VALUES ($1, $2)
       ON CONFLICT (email) DO UPDATE SET password_hash = $2`,
      [adminEmail.trim().toLowerCase(), hash]
    );
    console.log(`Admin account ensured for: ${adminEmail}`);
  }

  app.listen(PORT, () => {
    console.log(`Backend + frontend running on port ${PORT}`);
  });
}

init().catch(err => {
  console.error('Startup error:', err);
  process.exit(1);
});
