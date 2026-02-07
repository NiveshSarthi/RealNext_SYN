# Builder Stage
FROM node:18-bullseye-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including devDependencies for build)
# Using legacy-peer-deps to avoid potential conflicts
RUN npm install --legacy-peer-deps

# Copy application source code
COPY . .

# Build the application
# We need to set NEXT_PUBLIC_API_URL during build time for static generation if needed
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# Runner Stage
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy standalone build from builder
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# COPY --from=builder /app/public ./public

# Expose port
EXPOSE 3000

# Start command
CMD ["node", "server.js"]
