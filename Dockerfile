# syntax=docker/dockerfile:1

# MATIAS frontend (Next.js standalone server).
#
# next.config.ts is read during `next build`, so these are BUILD args:
#   BACKEND_URL      where /api/* is proxied to (e.g. http://backend:3000)
#   CONTACT_MAIL     support e-mail shown in "Central de ajuda"
#   CONTACT_NUMBER   support WhatsApp, digits with country code
#
#   docker build -t matias-front \
#     --build-arg BACKEND_URL=http://backend:3000 \
#     --build-arg CONTACT_MAIL=suporte@exemplo.com \
#     --build-arg CONTACT_NUMBER=5511912345678 .
#   docker run -p 3001:3000 matias-front

ARG NODE_VERSION=24
ARG PNPM_VERSION=12.8.1

FROM node:${NODE_VERSION}-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# --- Dependencies (cached until the lockfile changes) ---
FROM base AS deps
ARG PNPM_VERSION
RUN npm install -g pnpm@${PNPM_VERSION}
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --store-dir /pnpm/store

# --- Build ---
FROM base AS builder
ARG BACKEND_URL
ARG CONTACT_MAIL=""
ARG CONTACT_NUMBER=""
RUN test -n "$BACKEND_URL" || \
    (echo "Missing build arg BACKEND_URL (e.g. http://backend:3000)" >&2 && exit 1)
ENV BACKEND_URL=${BACKEND_URL} \
    CONTACT_MAIL=${CONTACT_MAIL} \
    CONTACT_NUMBER=${CONTACT_NUMBER}
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN node_modules/.bin/next build

# --- Runtime ---
FROM base AS runner
ARG BACKEND_URL
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    # The chat stream route handler reads it at runtime; keep it equal to
    # the build value (the /api rewrite was fixed at build time).
    BACKEND_URL=${BACKEND_URL}
RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
