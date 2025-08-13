# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Install deps
COPY package.json package-lock.json ./
RUN npm ci

# Copy source
COPY . .

# Build
RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/package.json /app/package-lock.json ./
# Copy built artifacts and node_modules (including dev tools for prisma/ts-node)
COPY --from=builder /app/node_modules ./node_modules

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/src ./src
COPY --from=builder /app/prisma ./prisma

ENV PORT=3000
EXPOSE 3000
# For healthcheck
RUN apk add --no-cache wget

# Clear Node image's default entrypoint so we can run a shell
ENTRYPOINT []

CMD ["sh", "-lc", "npx prisma db push --skip-generate && npx ts-node prisma/seed.ts && next start -p $PORT"]


