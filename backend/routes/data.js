import { Router } from 'express';
import pool from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Tables that any authenticated user can read
const CLIENT_READABLE = new Set([
  'clients', 'orders', 'nutrition_plans', 'workout_plans', 'exercises',
  'recipes', 'ingredients', 'plan_templates', 'weigh_ins', 'weight_goals',
  'coupons', 'bloodwork_files', 'client_notifications', 'age_attestations',
  'inventory', 'app_settings', 'inquiries',
]);

// Tables that only admins can write to
const ADMIN_WRITE_ONLY = new Set([
  'admins', 'coupons', 'inventory', 'plan_templates', 'recipes', 'exercises',
  'nutrition_plans', 'workout_plans', 'app_settings', 'inquiries',
]);

// Columns allowed for filtering (prevent SQL injection via column names)
const VALID_IDENTIFIER = /^[a-z_][a-z0-9_]*$/i;

// Serialize a value for pg. JS objects AND arrays destined for jsonb columns must
// be sent as JSON text — node-postgres otherwise turns arrays into Postgres array
// literals, which jsonb rejects ("invalid input syntax for type json").
function toParam(v) {
  return (v !== null && typeof v === 'object') ? JSON.stringify(v) : v;
}

function validateTable(table) {
  return CLIENT_READABLE.has(table);
}

function parseFilters(query) {
  const eq = {};
  const inFilter = {};
  const isFilter = {};

  for (const [key, val] of Object.entries(query)) {
    if (key.startsWith('_')) continue; // reserved
    if (key.includes('__in')) {
      const col = key.replace('__in', '');
      if (VALID_IDENTIFIER.test(col)) inFilter[col] = val.split(',');
    } else if (key.includes('__is')) {
      const col = key.replace('__is', '');
      if (VALID_IDENTIFIER.test(col)) isFilter[col] = val;
    } else if (VALID_IDENTIFIER.test(key)) {
      eq[key] = val;
    }
  }
  return { eq, inFilter, isFilter };
}

function buildWhereClause(filters, startIndex = 1) {
  const { eq, inFilter, isFilter } = filters;
  const conditions = [];
  const values = [];
  let idx = startIndex;

  for (const [col, val] of Object.entries(eq)) {
    conditions.push(`"${col}" = $${idx++}`);
    values.push(val);
  }
  for (const [col, vals] of Object.entries(inFilter)) {
    const placeholders = vals.map(() => `$${idx++}`).join(', ');
    conditions.push(`"${col}" IN (${placeholders})`);
    values.push(...vals);
  }
  for (const [col, val] of Object.entries(isFilter)) {
    if (val === 'null' || val === null) {
      conditions.push(`"${col}" IS NULL`);
    } else {
      conditions.push(`"${col}" IS NOT NULL`);
    }
  }

  return {
    where: conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '',
    values,
    nextIdx: idx,
  };
}

// GET /api/data/:table
router.get('/:table', requireAuth, async (req, res) => {
  const { table } = req.params;
  if (!validateTable(table)) return res.status(403).json({ message: 'Table not accessible.' });

  const { _order, _limit, _single, _select } = req.query;
  const filters = parseFilters(req.query);
  const { where, values } = buildWhereClause(filters);

  const cols = _select && _select !== '*' ? _select.split(',').map(c => `"${c.trim()}"`).join(', ') : '*';

  let sql = `SELECT ${cols} FROM "${table}" ${where}`;
  if (_order) {
    const [col, dir] = _order.split(':');
    if (VALID_IDENTIFIER.test(col)) {
      sql += ` ORDER BY "${col}" ${dir === 'desc' ? 'DESC' : 'ASC'}`;
    }
  }
  if (_limit) sql += ` LIMIT ${parseInt(_limit)}`;

  try {
    const result = await pool.query(sql, values);
    if (_single === '1' || _single === 'true') {
      if (result.rows.length === 0) return res.status(404).json({ message: 'No rows found.', code: 'PGRST116' });
      return res.json(result.rows[0]);
    }
    // maybeSingle
    if (_single === 'maybe') {
      return res.json(result.rows[0] || null);
    }
    res.json(result.rows);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST /api/data/:table — insert
router.post('/:table', requireAuth, async (req, res) => {
  const { table } = req.params;
  if (!validateTable(table)) return res.status(403).json({ message: 'Table not accessible.' });
  if (ADMIN_WRITE_ONLY.has(table) && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required.' });
  }

  const { _single } = req.query;
  const data = req.body;
  const rows = Array.isArray(data) ? data : [data];

  if (rows.length === 0) return res.status(400).json({ message: 'No data provided.' });

  const results = [];
  for (const row of rows) {
    const cols = Object.keys(row).filter(k => VALID_IDENTIFIER.test(k));
    if (cols.length === 0) return res.status(400).json({ message: 'No valid columns.' });
    const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
    const values = cols.map(c => toParam(row[c]));
    const sql = `INSERT INTO "${table}" (${cols.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders}) RETURNING *`;
    try {
      const r = await pool.query(sql, values);
      results.push(r.rows[0]);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  }

  if (_single === '1' || _single === 'true' || !Array.isArray(data)) {
    return res.json(results[0]);
  }
  res.json(results);
});

// PATCH /api/data/:table — update rows matching filters
router.patch('/:table', requireAuth, async (req, res) => {
  const { table } = req.params;
  if (!validateTable(table)) return res.status(403).json({ message: 'Table not accessible.' });
  if (ADMIN_WRITE_ONLY.has(table) && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required.' });
  }

  const { _single } = req.query;
  const data = req.body;
  const cols = Object.keys(data).filter(k => VALID_IDENTIFIER.test(k));
  if (cols.length === 0) return res.status(400).json({ message: 'No valid columns to update.' });

  const setClauses = cols.map((c, i) => `"${c}" = $${i + 1}`).join(', ');
  const values = cols.map(c => toParam(data[c]));

  const filters = parseFilters(req.query);
  const { where, values: filterValues } = buildWhereClause(filters, values.length + 1);

  const sql = `UPDATE "${table}" SET ${setClauses} ${where} RETURNING *`;
  try {
    const result = await pool.query(sql, [...values, ...filterValues]);
    if (_single === '1' || _single === 'true') {
      return res.json(result.rows[0] || null);
    }
    res.json(result.rows);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/data/:table — upsert
router.put('/:table', requireAuth, async (req, res) => {
  const { table } = req.params;
  if (!validateTable(table)) return res.status(403).json({ message: 'Table not accessible.' });
  if (ADMIN_WRITE_ONLY.has(table) && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required.' });
  }

  const { _onConflict } = req.query;
  const data = req.body;
  const rows = Array.isArray(data) ? data : [data];
  if (rows.length === 0) return res.status(400).json({ message: 'No data provided.' });

  const firstRow = rows[0];
  const cols = Object.keys(firstRow).filter(k => VALID_IDENTIFIER.test(k));
  if (cols.length === 0) return res.status(400).json({ message: 'No valid columns.' });

  const conflictCol = _onConflict || 'id';
  const updateCols = cols.filter(c => c !== conflictCol && c !== 'id');

  const results = [];
  for (const row of rows) {
    const values = cols.map(c => toParam(row[c]));
    const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
    const updateSet = updateCols.map((c, i) => `"${c}" = $${cols.indexOf(c) + 1}`).join(', ');
    const sql = `INSERT INTO "${table}" (${cols.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders})
      ON CONFLICT ("${conflictCol}") DO UPDATE SET ${updateSet || `"${conflictCol}" = "${conflictCol}"`}
      RETURNING *`;
    try {
      const r = await pool.query(sql, values);
      results.push(r.rows[0]);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  }

  if (!Array.isArray(data)) return res.json(results[0]);
  res.json(results);
});

// DELETE /api/data/:table — delete rows matching filters
router.delete('/:table', requireAuth, async (req, res) => {
  const { table } = req.params;
  if (!validateTable(table)) return res.status(403).json({ message: 'Table not accessible.' });
  if (ADMIN_WRITE_ONLY.has(table) && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required.' });
  }

  const filters = parseFilters(req.query);
  const { where, values } = buildWhereClause(filters);
  if (!where) return res.status(400).json({ message: 'Delete requires at least one filter.' });

  try {
    const result = await pool.query(`DELETE FROM "${table}" ${where} RETURNING *`, values);
    res.json(result.rows);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
