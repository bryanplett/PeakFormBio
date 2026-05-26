# Railway-optimized Dockerfile
# Builds a single image that serves BOTH the backend API and the static frontend.
# Replace the old docker-compose 3-service setup with this one container.

FROM node:20-alpine

WORKDIR /app

# ── Install backend deps first (better Docker layer caching) ─────────────────
COPY backend/package.json ./
RUN npm install --omit=dev

# ── Copy backend source code ─────────────────────────────────────────────────
COPY backend/ ./

# ── Copy static frontend files into ./public ─────────────────────────────────
RUN mkdir -p public public/assets uploads
COPY *.html ./public/
COPY *.jsx ./public/
COPY *.js ./public/
COPY *.css ./public/
COPY assets/ ./public/assets/

# Railway sets PORT at runtime; we listen on it (server.js already reads PORT)
EXPOSE 3001

CMD ["node", "server.js"]
