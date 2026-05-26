import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME     || 'peakform',
  user:     process.env.DB_USER     || 'peakform',
  password: process.env.DB_PASSWORD || 'peakform',
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

export default pool;
