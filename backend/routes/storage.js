import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const UPLOADS_DIR = process.env.UPLOADS_DIR || '/app/uploads';

// Ensure upload directories exist
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const bucket = req.params.bucket;
    const dir = path.join(UPLOADS_DIR, bucket);
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
});

// POST /api/storage/:bucket — upload a file
router.post('/:bucket', requireAuth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file provided.' });
  const filePath = req.body.path || req.file.filename;
  res.json({ path: filePath });
});

// GET /api/storage/:bucket/*path — serve a file
router.get('/:bucket/*', requireAuth, (req, res) => {
  const bucket = req.params.bucket;
  const filePath = req.params[0];
  const fullPath = path.join(UPLOADS_DIR, bucket, filePath);
  if (!fs.existsSync(fullPath)) return res.status(404).json({ message: 'File not found.' });
  res.sendFile(fullPath);
});

export default router;
