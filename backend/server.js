// ── Diagnostic logging FIRST, before any imports that could crash ────────────
process.stdout.write('=== server.js starting up ===\n');
process.stdout.write(`Node version: ${process.version}\n`);
process.stdout.write(`PORT env: ${process.env.PORT}\n`);
process.stdout.write(`DATABASE_URL set: ${!!process.env.DATABASE_URL}\n`);
process.stdout.write(`__dirname will be: working...\n`);

import 'dotenv/config';
process.stdout.write('[1/8] dotenv loaded\n');

import express from 'express';
process.stdout.write('[2/8] express loaded\n');

import cors from 'cors';
process.stdout.write('[3/8] cors loaded\n');

import path from 'path';
import { fileURLToPath } from 'url';
process.stdout.write('[4/8] path/url loaded\n');

import pool from './db.js';
process.stdout.write('[5/8] db.js loaded\n');

import authRouter from './routes/auth.js';
import dataRouter from './routes/data.js';
import storageRouter from './routes/storage.js';
import rpcRouter from './routes/rpc.js';
process.stdout.write('[6/8] routes loaded\n');

import bcrypt from 'bcryptjs';
process.stdout.write('[7/8] bcryptjs loaded\n');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.stdout.write(`[8/8] __dirname = ${__dirname}\n`);

const app = express();
const PORT = process.env.PORT || 3001;
process.stdout.write(`Using PORT = ${PORT}\n`);

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

// ── Static frontend ──────────────────────────────────────────────────────────
const PUBLIC_DIR = path.join(__dirname, 'public');
app.use(express.static(PUBLIC_DIR));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Wait for DB and seed admin on startup
async function init() {
  process.stdout.write('init() called, attempting DB connection...\n');
  let retries = 10;
  while (retries > 0) {
    try {
      await pool.query('SELECT 1');
      process.stdout.write('Database connected.\n');
      break;
    } catch (err) {
      retries--;
      process.stdout.write(`DB not ready, retrying in 3s... (${retries} left). Error: ${err.message}\n`);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  if (retries === 0) {
    process.stderr.write('Could not connect to database. Exiting.\n');
    process.exit(1);
  }

  // Seed default admin if credentials are set in env
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    try {
      const hash = await bcrypt.hash(adminPassword, 12);
      await pool.query(
        `INSERT INTO admins (email, password_hash)
         VALUES ($1, $2)
         ON CONFLICT (email) DO UPDATE SET password_hash = $2`,
        [adminEmail.trim().toLowerCase(), hash]
      );
      process.stdout.write(`Admin account ensured for: ${adminEmail}\n`);
    } catch (err) {
      process.stderr.write(`Admin seed failed: ${err.message}\n`);
    }
  }

  // Listen on 0.0.0.0 explicitly (Railway needs this — not just localhost)
  app.listen(PORT, '0.0.0.0', () => {
    process.stdout.write(`Backend + frontend listening on 0.0.0.0:${PORT}\n`);
  });
}

init().catch(err => {
  process.stderr.write(`Startup error: ${err.stack || err}\n`);
  process.exit(1);
});

// Catch any unhandled errors so they get logged
process.on('uncaughtException', (err) => {
  process.stderr.write(`UNCAUGHT EXCEPTION: ${err.stack || err}\n`);
});
process.on('unhandledRejection', (err) => {
  process.stderr.write(`UNHANDLED REJECTION: ${err.stack || err}\n`);