# Multi-stage Dockerfile for Next.js and Socket.IO Server
FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Builder stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# Runner stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Install concurrently or production runner if needed
RUN npm install -g concurrently ts-node

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/tsconfig.server.json ./tsconfig.server.json

EXPOSE 3000
EXPOSE 3001

# Run both Next.js app (port 3000) and Socket.IO server (port 3001) concurrently
CMD ["npx", "concurrently", "\"npm run start\"", "\"npm run server\""]
