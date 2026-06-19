FROM node:22-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM base AS builder
RUN apk add --no-cache openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Full node_modules so the Prisma CLI (used by migrate.js at boot) has all of
# its deps — @prisma/config pulls in effect/c12/etc. Overrides the trimmed
# node_modules from the standalone copy above (superset, so the server is fine).
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/scripts ./scripts

USER nextjs
EXPOSE 3000

CMD ["sh", "-c", "node scripts/migrate.js && node server.js"]
