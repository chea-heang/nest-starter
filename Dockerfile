# ─── Stage 1: Base & Dependencies ─────────────────────────────────────────────
FROM node:22-alpine AS dependencies

WORKDIR /app

# Install native dependencies required for native addons (bcrypt, openssl for prisma)
RUN apk add --no-cache python3 make g++ openssl libc6-compat
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# Copy dependency manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies required for compilation)
RUN pnpm install --frozen-lockfile

# Generate Prisma client for linux-musl engine
RUN ./node_modules/.bin/prisma generate

# ─── Stage 2: Builder ─────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/prisma ./prisma
COPY . .

# Compile TypeScript to dist/
RUN pnpm run build

# Prune development dependencies to keep production image compact
RUN pnpm prune --prod

# ─── Stage 3: Production Runner ───────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOME=/home/nestjs

# Install runtime dependencies: dumb-init (PID 1 supervisor), openssl (prisma engine), wget (healthcheck probe)
RUN apk add --no-cache openssl dumb-init wget

# Create non-root system user and dedicated home directory
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --home /home/nestjs --ingroup nodejs nestjs

# Pre-create logs directory with correct permissions for Winston logger
RUN mkdir -p /app/logs /home/nestjs && \
    chown -R nestjs:nodejs /app/logs /home/nestjs

# Copy built bundles, production dependencies, and schema with non-root ownership
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./package.json
COPY --chown=nestjs:nodejs public ./public
COPY --chown=nestjs:nodejs docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER nestjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1 || exit 1

ENTRYPOINT ["/usr/bin/dumb-init", "--", "/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
