# syntax=docker/dockerfile:1

# ---- Build stage -----------------------------------------------------------
# Full dependency install: nest/tsc live in devDependencies and are required
# to compile, so this MUST be a complete `npm ci` (not --omit=dev).
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

RUN npm ci

COPY src ./src
RUN npm run build

# ---- Production dependencies stage ----------------------------------------
# Install ONLY runtime dependencies so the final image stays slim.
FROM node:22-alpine AS prod-deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ---- Production stage ------------------------------------------------------
FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

# Run as a non-root user.
RUN addgroup -g 1001 -S nodejs \
  && adduser -S nestjs -u 1001 \
  && chown -R nestjs:nodejs /app

COPY --from=prod-deps --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder  --chown=nestjs:nodejs /app/package*.json ./
COPY --from=builder  --chown=nestjs:nodejs /app/dist ./dist

USER nestjs

# Liveness probe (no DB dependency, unlike GET /health which pings the DB).
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:'+(process.env.PORT||3001)+'/api/v1/health/liveness',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

EXPOSE 3001

CMD ["node", "dist/main.js"]
