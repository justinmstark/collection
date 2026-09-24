# Stage 1: install dependencies
FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY package*.json ./
RUN npm ci
# Install sharp binary for linux-musl (Alpine) — the default install targets the host OS
RUN npm install --os=linux --libc=musl --cpu=x64 sharp

# Stage 2: build
FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=deps /app/node_modules ./node_modules
# Bust cache if source changes aren't being picked up
ARG CACHEBUST=1
COPY . .
RUN npx prisma generate
RUN mkdir -p public
# MinIO public URL is baked in at build time (NEXT_PUBLIC_ vars)
ARG NEXT_PUBLIC_MINIO_PUBLIC_URL=http://localhost:9000
ARG NEXT_PUBLIC_MINIO_BUCKET=collection-images
ENV NEXT_PUBLIC_MINIO_PUBLIC_URL=$NEXT_PUBLIC_MINIO_PUBLIC_URL
ENV NEXT_PUBLIC_MINIO_BUCKET=$NEXT_PUBLIC_MINIO_BUCKET
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 3: minimal runtime
FROM node:22-alpine AS runner
WORKDIR /app
RUN apk add --no-cache openssl
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
# Add Prisma CLI so migrations don't need npx/npm at runtime
COPY --from=deps /app/node_modules/prisma ./node_modules/prisma
COPY --from=deps /app/node_modules/@prisma ./node_modules/@prisma
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
