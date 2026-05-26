FROM node:20-alpine

WORKDIR /app

COPY backend/package.json ./
RUN npm install --omit=dev

COPY backend/ ./

RUN mkdir -p public public/assets uploads
COPY deploy/*.html ./public/
COPY deploy/*.jsx ./public/
COPY deploy/*.js ./public/
COPY deploy/*.css ./public/
COPY deploy/assets/ ./public/assets/

EXPOSE 3001

CMD ["node", "server.js"]