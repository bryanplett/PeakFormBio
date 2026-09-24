import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import pool from '../db.js';
import { signToken, requireAdmin } from '../middleware/auth.js';
import { sendEmail, escHtml } from '../lib/email.js';

const router = Router();
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
function hashToken(raw) { return crypto.createHash('sha256').update(raw).digest('hex'); }

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required.' });

  const lowerEmail = email.trim().toLowerCase();

  // Check admins table first
  const adminRes = await pool.query('SELECT * FROM admins WHERE email = $1', [lowerEmail]);
  if (adminRes.rows.length > 0) {
    const admin = adminRes.rows[0];
    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) return res.status(401).json({ message: 'Invalid email or password.' });
    const token = signToken({ id: admin.id, email: admin.email, role: 'admin' });
    return res.json({ token, user: { id: admin.id, email: admin.email, role: 'admin' } });
  }

  // Check clients table
  const clientRes = await pool.query('SELECT * FROM clients WHERE email = $1', [lowerEmail]);
  if (clientRes.rows.length === 0) return res.status(401).json({ message: 'Invalid email or password.' });
  const client = clientRes.rows[0];
  if (!client.password_hash) return res.status(401).json({ message: 'No password set. Contact your coach.' });
  const valid = await bcrypt.compare(password, client.password_hash);
  if (!valid) return res.status(401).json({ message: 'Invalid email or password.' });
  const token = signToken({ id: client.id, email: client.email, role: 'client' });
  res.json({ token, user: { id: client.id, email: client.email, role: 'client' } });
});

// POST /api/auth/signup — admin-only: create a new client account
router.post('/signup', requireAdmin, async (req, res) => {
  const { email, password, name, phone } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required.' });
  if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' });

  const lowerEmail = email.trim().toLowerCase();
  const hash = await bcrypt.hash(password, 12);

  try {
    await pool.query(
      `INSERT INTO clients (email, password_hash, name, phone, status, pricelist)
       VALUES ($1, $2, $3, $4, 'invited', 'wholesale')
       ON CONFLICT (email) DO UPDATE SET password_hash = $2, name = COALESCE($3, clients.name), phone = COALESCE($4, clients.phone), status = 'invited'`,
      [lowerEmail, hash, name || lowerEmail, phone || null]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST /api/auth/request-password-reset — client self-serve: email a reset link.
// Always responds ok:true (even if the email isn't on file) to avoid leaking
// which emails have accounts.
router.post('/request-password-reset', async (req, res) => {
  const { email, redirectTo } = req.body || {};
  if (!email) return res.status(400).json({ message: 'Email required.' });
  const lowerEmail = email.trim().toLowerCase();

  try {
    const clientRes = await pool.query('SELECT id, name FROM clients WHERE email = $1', [lowerEmail]);
    if (clientRes.rows.length > 0) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
      await pool.query(
        'UPDATE clients SET reset_token_hash = $1, reset_token_expires = $2 WHERE id = $3',
        [hashToken(rawToken), expires, clientRes.rows[0].id]
      );
      const base = (redirectTo || '').split('?')[0] || 'https://www.peakformbio.com/portal';
      const link = `${base}?reset_token=${rawToken}`;
      const name = clientRes.rows[0].name || 'there';
      await sendEmail({
        to: lowerEmail,
        subject: 'Reset your PeakFormBio password',
        html: `<p>Hi ${escHtml(name)},</p><p>Click below to set a new password. This link expires in 1 hour.</p><p><a href="${link}">${link}</a></p><p>If you didn't request this, you can ignore this email.</p>`,
        text: `Reset your password: ${link} (expires in 1 hour)`,
      });
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/reset-password — client self-serve: consume the token from the email link.
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body || {};
  if (!token || !password) return res.status(400).json({ message: 'Token and password required.' });
  if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' });

  try {
    const r = await pool.query(
      'SELECT id, reset_token_expires FROM clients WHERE reset_token_hash = $1',
      [hashToken(token)]
    );
    if (r.rows.length === 0) return res.status(400).json({ message: 'Invalid or expired reset link.' });
    const row = r.rows[0];
    if (!row.reset_token_expires || new Date(row.reset_token_expires) < new Date()) {
      return res.status(400).json({ message: 'This reset link has expired. Request a new one.' });
    }
    const hash = await bcrypt.hash(password, 12);
    await pool.query(
      'UPDATE clients SET password_hash = $1, reset_token_hash = NULL, reset_token_expires = NULL WHERE id = $2',
      [hash, row.id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me — returns current user from token
router.get('/me', (req, res) => {
  const header = req.headers['authorization'] || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Not authenticated.' });
  try {
    const { id, email, role, iat, exp } = jwt.verify(token, process.env.JWT_SECRET || 'change-me-in-production');
    res.json({ id, email, role });
  } catch {
    res.status(401).json({ message: 'Invalid token.' });
  }
});

// POST /api/auth/admin-set-password — admin sets a client's password directly
router.post('/admin-set-password', requireAdmin, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required.' });
  if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' });

  const hash = await bcrypt.hash(password, 12);
  const r = await pool.query(
    'UPDATE clients SET password_hash = $1 WHERE email = $2 RETURNING id',
    [hash, email.trim().toLowerCase()]
  );
  if (r.rowCount === 0) return res.status(404).json({ message: 'Client not found.' });
  res.json({ ok: true });
});

// GET /api/auth/admins — list all admin accounts (admin only)
router.get('/admins', requireAdmin, async (req, res) => {
  const r = await pool.query('SELECT id, email, created_at FROM admins ORDER BY created_at ASC');
  res.json(r.rows);
});

// POST /api/auth/create-admin — create a new admin account (admin only)
router.post('/create-admin', requireAdmin, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required.' });
  if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' });

  const lowerEmail = email.trim().toLowerCase();
  const hash = await bcrypt.hash(password, 12);

  try {
    const r = await pool.query(
      'INSERT INTO admins (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
      [lowerEmail, hash]
    );
    res.json({ ok: true, admin: r.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ message: 'An admin with this email already exists.' });
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/auth/admins/:id — delete an admin (cannot delete your own account)
router.delete('/admins/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  if (req.user.id === id) return res.status(400).json({ message: 'You cannot delete your own admin account.' });

  const r = await pool.query('DELETE FROM admins WHERE id = $1 RETURNING id', [id]);
  if (r.rowCount === 0) return res.status(404).json({ message: 'Admin not found.' });
  res.json({ ok: true });
});

export default router;
