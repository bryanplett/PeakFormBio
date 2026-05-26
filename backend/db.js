import pg from 'pg';

const { Pool } = pg;

// On Railway: use DATABASE_URL (auto-provided by the Postgres add-on).
// Locally / self-hosted: fall back to individual DB_* env vars.
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    })
  : new Pool({
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
