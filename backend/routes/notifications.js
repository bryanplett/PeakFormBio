import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { notifyAdmin, escHtml as h } from '../lib/email.js';

const router = Router();

// ─── POST /api/notifications/consultation ─────────────────────────────────
// Public endpoint — the consultation form on the homepage posts here.
// Saves the booking to the consultations table, then emails admin.
router.post('/consultation', async (req, res) => {
  const {
    name, email, phone, focus, goal,
    preferred_date, preferred_time, meeting_option
  } = req.body || {};

  if (!name || !email) {
    return res.status(400).json({ message: 'Name and email are required.' });
  }

  let savedId = null;
  try {
    const r = await pool.query(
      `INSERT INTO consultations
         (name, email, phone, focus, goal,
          preferred_date, preferred_time, meeting_option, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
       RETURNING id`,
      [
        name, email, phone || null, focus || null, goal || null,
        preferred_date || null, preferred_time || null, meeting_option || null
      ]
    );
    savedId = r.rows[0].id;
  } catch (err) {
    console.error('Save consultation failed:', err);
    return res.status(500).json({ message: 'Could not save consultation.' });
  }

  // Fire-and-forget email — don't fail the form if email is slow/down.
  notifyAdmin({
    subject: `New Consultation Booking — ${name} (${focus || 'Unspecified'})`,
    html: `
      <h2 style="font-family:sans-serif;">New Consultation Booking</h2>
      <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;">
        <tr><td style="padding:4px 12px 4px 0;color:#666;">Name</td><td><strong>${h(name)}</strong></td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;">Email</td><td><a href="mailto:${h(email)}">${h(email)}</a></td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;">Phone</td><td>${h(phone || '(not provided)')}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;">Focus</td><td>${h(focus || '(not selected)')}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;">Goal</td><td>${h(goal || '(none provided)')}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;">Preferred date</td><td>${h(preferred_date)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;">Preferred time</td><td>${h(preferred_time)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;">Meeting</td><td>${h(meeting_option)}</td></tr>
      </table>
      <p style="margin-top:20px;font-family:sans-serif;font-size:13px;color:#666;">
        Manage this booking in your <a href="https://www.peakformbio.com/Admin.html">Admin Panel</a>.
      </p>
    `
  }).catch(e => console.warn('Email failed for consultation ' + savedId + ':', e.message));

  res.json({ ok: true, id: savedId });
});

// ─── POST /api/notifications/admin-event ──────────────────────────────────
// Admin-only — sends a notification email to the admin.
// Used for things like "nutrition plan updated for client X".
router.post('/admin-event', requireAuth, async (req, res) => {
  const { subject, body, html } = req.body || {};
  if (!subject) return res.status(400).json({ message: 'subject required' });

  const result = await notifyAdmin({
    subject,
    text: body,
    html: html || (body ? '<pre style="font-family:sans-serif;white-space:pre-wrap;">' + h(body) + '</pre>' : undefined)
  });
  res.json({ ok: true, sent: result.ok });
});

// ─── POST /api/notifications/order ────────────────────────────────────────
// Authenticated client — fires when a client places an order in the portal.
router.post('/order', requireAuth, async (req, res) => {
  const { items, total, client_name, client_email, client_phone, summary, order_id } = req.body || {};

  const itemRows = Array.isArray(items)
    ? items.map(it => '<tr><td style="padding:4px 16px 4px 0;">' + h(it.label) + '</td><td style="text-align:right;">× ' + h(it.qty) + '</td></tr>').join('')
    : (summary ? '<tr><td colspan="2"><pre style="font-family:sans-serif;white-space:pre-wrap;">' + h(summary) + '</pre></td></tr>' : '');

  const result = await notifyAdmin({
    subject: `New Order — ${client_name || 'unknown client'}${total ? ' ($' + total + ')' : ''}`,
    html: `
      <h2 style="font-family:sans-serif;">New Order Placed</h2>
      <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;">
        <tr><td style="padding:4px 12px 4px 0;color:#666;">Client</td><td><strong>${h(client_name || '')}</strong></td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;">Email</td><td>${h(client_email || '')}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;">Phone</td><td>${h(client_phone || '')}</td></tr>
        ${total ? '<tr><td style="padding:4px 12px 4px 0;color:#666;">Total</td><td>$' + h(total) + '</td></tr>' : ''}
      </table>
      <h3 style="font-family:sans-serif;margin-top:24px;">Items</h3>
      <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;">${itemRows}</table>
      <p style="margin-top:20px;font-family:sans-serif;font-size:13px;color:#666;">
        Open this order in your <a href="https://www.peakformbio.com/Admin.html">Admin Panel</a>.
      </p>
    `
  });
  res.json({ ok: true, sent: result.ok });
});

// ─── POST /api/public/groupbuy-order ─────────────────────────────────────
// Public (no auth) — fires when a vendor submits a group buy order.
// Inserts into the orders table and emails admin.
router.post('/groupbuy-order', async (req, res) => {
  const { name, email, phone, address, qty, product, payment_method, order_ref, total } = req.body || {};

  if (!name || !email || !order_ref) {
    return res.status(400).json({ message: 'name, email and order_ref are required.' });
  }

  let savedId = null;
  try {
    const r = await pool.query(
      `INSERT INTO orders
         (product, quantity, payment_method, shipping_method,
          status, payment_status, phone_at_order, notes)
       VALUES ($1, $2, $3, 'priority', 'pending', 'reported', $4, $5)
       RETURNING id`,
      [
        product || 'Retatrutide 10-Vial Kit',
        parseInt(qty) || 1,
        payment_method || '',
        phone || null,
        `GROUP BUY | Ref: ${order_ref} | Name: ${name} | Email: ${email} | Address: ${address || '(not provided)'}`,
      ]
    );
    savedId = r.rows[0]?.id;
  } catch (err) {
    console.warn('Group buy order DB insert failed:', err.message);
  }

  notifyAdmin({
    subject: `New Group Buy Order — ${name} (${order_ref})`,
    html: `
      <h2 style="font-family:sans-serif;">New Group Buy Order</h2>
      <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;">
        <tr><td style="padding:4px 12px 4px 0;color:#666;">Ref</td><td><strong>${h(order_ref)}</strong></td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;">Name</td><td>${h(name)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;">Email</td><td><a href="mailto:${h(email)}">${h(email)}</a></td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;">Phone</td><td>${h(phone || '(not provided)')}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;">Ship To</td><td>${h(address || '(not provided)')}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;">Product</td><td>${h(product || 'Retatrutide 10-Vial Kit')}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;">Kits</td><td>${h(qty)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;">Total</td><td>$${h(total)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;">Payment</td><td>${h(payment_method)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;">Shipping</td><td>Priority ($15)</td></tr>
      </table>
      <p style="margin-top:20px;font-family:sans-serif;font-size:13px;color:#666;">
        View this order in your <a href="https://www.peakformbio.com/admin">Admin Panel</a>.
      </p>
    `
  }).catch(e => console.warn('Group buy email failed:', e.message));

  res.json({ ok: true, id: savedId });
});

export default router;
