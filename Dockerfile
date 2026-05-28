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

# Logo / brand assets folder (referenced from HTML as /1_5058...)
COPY deploy/1_5058098532557259934/ ./public/1_5058098532557259934/

# Hero / static images (referenced from HTML as /uploads/...)
COPY uploads/ ./uploads/

EXPOSE 3001

CMD ["node", "server.js"]
