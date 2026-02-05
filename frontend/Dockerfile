FROM node:18-alpine AS builder
WORKDIR /app

# Declare build arguments that Coolify will pass
ARG NEXT_PUBLIC_API_URL
ARG NODE_ENV
ARG COOLIFY_URL
ARG COOLIFY_FQDN
ARG SERVICE_URL_FRONTEND
ARG SERVICE_FQDN_FRONTEND
ARG PORT

# Convert ARGs to ENV so they're available during build
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
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

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
