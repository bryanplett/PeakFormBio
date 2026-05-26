# Railway-optimized Dockerfile
# Builds a single image that serves BOTH the backend API and the static frontend.
# Frontend source: the deploy/ folder (newer/more complete than repo root).

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

# Railway sets PORT at runtime; we listen on it (server.js already reads PORT)
EXPOSE 3001