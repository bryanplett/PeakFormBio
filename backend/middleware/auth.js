import jwt from 'jsonwebtoken';
import pool from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

export async function requireAuth(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'No token provided.' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
  // Disabled clients are locked out immediately, even if they're already
  // signed in (tokens last 30 days, so checking only at login isn't enough).
  if (req.user.role === 'client') {
    try {
      const r = await pool.query('SELECT status FROM clients WHERE id = $1', [req.user.id]);
      if (r.rows[0]?.status === 'disabled') {
        return res.status(401).json({ message: 'This account has been disabled. Please contact PeakFormBio.' });
      }
    } catch (e) { /* DB hiccup: don't lock everyone out */ }
  }
  next();
}

export function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required.' });
    }
    next();
  });
}

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}
