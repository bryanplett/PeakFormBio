# Railway-optimized Dockerfile
# DEBUG VERSION — prints diagnostics before starting Node.

FROM node:20-alpine

WORKDIR /app

# ── Install backend deps first (better Docker layer caching) ─────────────────
COPY backend/package.json ./
RUN npm install --omit=dev

# ── Copy backend source code ─────────────────────────────────────────────────
COPY backend/ ./

# ── Copy static frontend files into ./public (from deploy/ folder) ───────────
RUN mkdir -p public public/assets uploads
COPY deploy/*.html ./public/
COPY deploy/*.jsx ./public/
COPY deploy/*.js ./public/
COPY deploy/*.css ./public/
COPY deploy/assets/ ./public/assets/

EXPOSE 3001

# ── DEBUG: print container info BEFORE running node ──────────────────────────
CMD ["sh", "-c", "echo '=== CONTAINER STARTED ===' && echo 'Node version:' && node --version && echo 'Files in /app:' && ls -la /app/ && echo 'Starting server.js...' && node server.js"]