# syntax=docker/dockerfile:1
# ----------------------------------------------------------------------------
# SkillLink API (NestJS + Prisma) — multi-stage build.
#  - builder: installs ALL deps, generates the Prisma client, compiles TS → dist
#  - runner:  ships only prod deps + dist + the generated Prisma client
# The monorepo uses npm workspaces, so we build from the repo root with the
# apps/api package. Build context = repo root (see docker-compose / CI).
# ----------------------------------------------------------------------------

# ---- builder ----
FROM node:18-alpine AS builder
WORKDIR /app

# Copy only manifests first → Docker caches `npm ci` unless deps change.
COPY package*.json ./
COPY apps/api/package*.json apps/api/
RUN npm ci

# Prisma needs its schema present to generate the client.
COPY apps/api/prisma apps/api/prisma
RUN npm run prisma:generate

# Now the source, then compile.
COPY apps/api apps/api
RUN npm run build --workspace apps/api

# ---- runner ----
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Production deps only (smaller image). Workspace manifests again for npm.
COPY package*.json ./
COPY apps/api/package*.json apps/api/
RUN npm ci --omit=dev --workspace apps/api && npm cache clean --force

# Generated Prisma client + compiled output from the builder.
COPY --from=builder /app/node_modules/.prisma node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma node_modules/@prisma
COPY --from=builder /app/apps/api/dist apps/api/dist
COPY --from=builder /app/apps/api/prisma apps/api/prisma

# Run as the unprivileged built-in `node` user (security baseline).
USER node
EXPOSE 4000
# start:prod = `node dist/main.js`
CMD ["node", "apps/api/dist/main.js"]
