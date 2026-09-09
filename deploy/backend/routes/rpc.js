import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { notifyAdmin, escHtml as h } from '../lib/email.js';

const router = Router();
const LOW_STOCK_THRESHOLD = 5;

// POST /api/rpc/apply_order_to_inventory
router.post('/apply_order_to_inventory', requireAuth, async (req, res) => {
  const { p_order_id } = req.body;
  if (!p_order_id) return res.status(400).json({ message: 'p_order_id required.' });

  const client = await pool.connect();
  let lowStockAlert = null;
  try {
    await client.query('BEGIN');

    const orderRes = await client.query(
      'SELECT * FROM orders WHERE id = $1 AND inventory_applied IS NOT TRUE',
      [p_order_id]
    );
    if (orderRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.json({ ok: true, skipped: true });
    }
    const order = orderRes.rows[0];

    const productName = order.product || order.item;
    const qty = parseInt(order.quantity || order.qty || 1);

    if (productName) {
      // Lock the row (creating it at 0 if it doesn't exist yet) so two
      // simultaneous orders can't both read the same stock number before
      // either writes it back — this is what was letting stock go negative.
      await client.query(
        `INSERT INTO inventory (product_name, stock, updated_at) VALUES ($1, 0, now())
         ON CONFLICT (product_name) DO NOTHING`,
        [productName]
      );
      const stockRes = await client.query(
        'SELECT stock FROM inventory WHERE product_name = $1 FOR UPDATE',
        [productName]
      );
      const currentStock = stockRes.rows[0]?.stock ?? 0;

      if (currentStock < qty) {
        await client.query('ROLLBACK');
        return res.json({ ok: false, error: 'insufficient stock', remaining: currentStock });
      }

      const updRes = await client.query(
        `UPDATE inventory SET stock = stock - $2, updated_at = now()
         WHERE product_name = $1 RETURNING stock`,
        [productName, qty]
      );
      const remaining = updRes.rows[0].stock;
      if (remaining <= LOW_STOCK_THRESHOLD) {
        lowStockAlert = { productName, remaining };
      }
    }

    await client.query('UPDATE orders SET inventory_applied = true WHERE id = $1', [p_order_id]);
    await client.query('COMMIT');

    if (lowStockAlert) {
      notifyAdmin({
        subject: `Low stock: ${lowStockAlert.productName} (${lowStockAlert.remaining} left)`,
        html: `<p>${h(lowStockAlert.productName)} is down to <strong>${lowStockAlert.remaining}</strong> units.` +
          (lowStockAlert.remaining <= 0 ? ' It is now OUT OF STOCK — further orders for it will be rejected.' : '') + '</p>'
      }).catch(e => console.warn('Low stock email failed:', e.message));
    }

    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ message: err.message });
  } finally {
    client.release();
  }
});

// POST /api/rpc/revert_order_from_inventory
router.post('/revert_order_from_inventory', requireAuth, async (req, res) => {
  const { p_order_id } = req.body;
  if (!p_order_id) return res.status(400).json({ message: 'p_order_id required.' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const orderRes = await client.query(
      'SELECT * FROM orders WHERE id = $1 AND inventory_applied = true',
      [p_order_id]
    );
    if (orderRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.json({ ok: true, skipped: true });
    }
    const order = orderRes.rows[0];

    const productName = order.product || order.item;
    const qty = parseInt(order.quantity || order.qty || 1);

    if (productName) {
      await client.query(
        `UPDATE inventory SET stock = stock + $1, updated_at = now() WHERE product_name = $2`,
        [qty, productName]
      );
    }

    await client.query('UPDATE orders SET inventory_applied = false WHERE id = $1', [p_order_id]);
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ message: err.message });
  } finally {
    client.release();
  }
});

export default router;
