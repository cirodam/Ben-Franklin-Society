# syntax=docker/dockerfile:1

# Stage 1: Install dependencies
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# Enable Corepack for pnpm
RUN corepack enable && corepack prepare pnpm@11.0.9 --activate

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/crypto/package.json ./packages/crypto/
COPY packages/db/package.json ./packages/db/
COPY packages/events/package.json ./packages/events/
COPY packages/types/package.json ./packages/types/
COPY packages/ui/package.json ./packages/ui/
COPY packages/oidc-client/package.json ./packages/oidc-client/
COPY apps/community-bank/package.json ./apps/community-bank/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Stage 2: Build the application
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# Enable Corepack
RUN corepack enable && corepack prepare pnpm@11.0.9 --activate

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages

# Copy source code
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json ./
COPY packages ./packages
COPY apps/community-bank ./apps/community-bank

# Build the app
WORKDIR /app/apps/community-bank
RUN pnpm build

# Stage 3: Production image
FROM node:22-alpine AS runner
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Create data directory
RUN mkdir -p /app/data

# Copy built application
COPY --from=builder /app/apps/community-bank/build ./build
COPY --from=builder /app/apps/community-bank/package.json ./

# Copy node_modules (SvelteKit adapter-node needs them)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages

# Environment defaults
ENV NODE_ENV=production
ENV PORT=5174
ENV DATABASE_PATH=/app/data/bank.db

EXPOSE 5174

CMD ["node", "build"]
