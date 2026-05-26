import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// POST /api/rpc/apply_order_to_inventory
router.post('/apply_order_to_inventory', requireAuth, async (req, res) => {
  const { p_order_id } = req.body;
  if (!p_order_id) return res.status(400).json({ message: 'p_order_id required.' });

  const client = await pool.connect();
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
      await client.query(
        `INSERT INTO inventory (product_name, stock, updated_at)
         VALUES ($1, -$2, now())
         ON CONFLICT (product_name) DO UPDATE SET stock = inventory.stock - $2, updated_at = now()`,
        [productName, qty]
      );
    }

    await client.query('UPDATE orders SET inventory_applied = true WHERE id = $1', [p_order_id]);
    await client.query('COMMIT');
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
