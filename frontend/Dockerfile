FROM node:18-bullseye-slim
WORKDIR /app

# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
# RUN apk add --no-cache libc6-compat

# Increase memory limit for build
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Declare build arguments that Coolify will pass
ARG NEXT_PUBLIC_API_URL=http://localhost:5000
ARG NODE_ENV
ARG COOLIFY_URL
ARG COOLIFY_FQDN
ARG SERVICE_URL_FRONTEND
ARG SERVICE_FQDN_FRONTEND
ARG PORT

# Convert ARGs to ENV so they're available during build
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-http://localhost:5000}
ENV NODE_ENV=${NODE_ENV:-production}

# Install dependencies directly in builder stage
COPY package*.json ./
RUN npm ci

COPY . .

# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED 1
# Skip linting and type checking during build to prevent failures in strict CI environments
ENV NEXT_IGNORE_ESLINT_BUILD_ERRORS=1
ENV NEXT_IGNORE_TYPE_CHECK_ERRORS=1

RUN npm run build

# Arrange files for standalone mode in the same stage
RUN mkdir -p .next/standalone/public && \
    cp -r public/* .next/standalone/public/ && \
    mkdir -p .next/standalone/.next/static && \
    cp -r .next/static/* .next/standalone/.next/static/

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", ".next/standalone/server.js"]
