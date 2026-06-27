# syntax=docker/dockerfile:1
# ----------------------------------------------------------------------------
# SkillLink Web (Next.js) — multi-stage build using Next "standalone" output.
#  - builder: install deps + `next build` → emits .next/standalone (self-contained)
#  - runner:  copy only the standalone server + static assets → tiny image
# NEXT_PUBLIC_* vars are baked at BUILD time (they ship to the browser), so the
# API URL is passed as a build arg. Build context = repo root.
# ----------------------------------------------------------------------------

# ---- builder ----
FROM node:18-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY apps/web/package*.json apps/web/
RUN npm ci

COPY apps/web apps/web

# Public API URL is compiled into the client bundle at build time.
ARG NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build --workspace apps/web

# ---- runner ----
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Standalone server bundle + the static + public assets it serves.
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

USER node
EXPOSE 3000
# standalone emits the server entrypoint at apps/web/server.js (monorepo path)
CMD ["node", "apps/web/server.js"]
