FROM node:20-alpine

WORKDIR /app

COPY backend/package.json backend/package-lock.json ./
RUN npm ci --production

COPY backend/ ./
COPY frontend/ ./frontend/

EXPOSE 3000

CMD ["node", "server.js"]