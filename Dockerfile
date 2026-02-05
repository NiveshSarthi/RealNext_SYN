# Build Stage for Backend
FROM node:18-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/ ./

# Build Stage for Frontend
FROM node:18-bullseye-slim AS frontend-builder
WORKDIR /app/frontend
ENV NODE_OPTIONS="--max-old-space-size=4096"
ARG NEXT_PUBLIC_API_URL=https://r.niveshsarthi.com:5050
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
COPY frontend/package*.json ./
RUN rm -f package-lock.json && npm cache clean --force && npm install
COPY frontend/ ./
RUN npm run build

# Prepare final standalone layout
RUN mkdir -p .next/standalone/public && \
    ([ -d "public" ] && cp -r public/* .next/standalone/public/ || true) && \
    mkdir -p .next/standalone/.next/static && \
    ([ -d ".next/static" ] && cp -r .next/static/* .next/standalone/.next/static/ || true)

# Final Stage
FROM node:18-bullseye-slim
WORKDIR /app

# Install bash for the startup script
RUN apt-get update && apt-get install -y bash && rm -rf /var/lib/apt/lists/*

# Copy backend
COPY --from=backend-builder /app/backend /app/backend

# Copy frontend (everything needed is now in standalone)
COPY --from=frontend-builder /app/frontend/.next/standalone /app/frontend

# Copy startup script
COPY start-services.sh /app/start-services.sh
RUN chmod +x /app/start-services.sh

# Expose ports
EXPOSE 5050
EXPOSE 3030

# Environment variables
ENV PORT_BACKEND=5050
ENV PORT_FRONTEND=3030

CMD ["/app/start-services.sh"]
