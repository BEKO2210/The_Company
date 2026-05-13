FROM node:20-alpine AS base
WORKDIR /app
COPY backend/ ./backend/
COPY frontend/ ./frontend/
EXPOSE 8080
ENV HOST=0.0.0.0 PORT=8080 STATE_FILE=/app/state/counter.json STATIC_DIR=/app/frontend
RUN mkdir -p /app/state && adduser -D -u 10001 hello && chown -R hello /app
USER hello
CMD ["node", "backend/server.js"]
