# syntax=docker/dockerfile:1

# Stage 1: Install dependencies
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# Enable Corepack for pnpm
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc .pnpm-approvals ./
COPY packages/crypto/package.json ./packages/crypto/
COPY packages/db/package.json ./packages/db/
COPY packages/events/package.json ./packages/events/
COPY packages/types/package.json ./packages/types/
COPY packages/ui/package.json ./packages/ui/
COPY packages/oidc-client/package.json ./packages/oidc-client/
COPY apps/mail/package.json ./apps/mail/

# Install dependencies
RUN pnpm install --frozen-lockfile || (pnpm approve-builds argon2 better-sqlite3 esbuild && pnpm install --frozen-lockfile)

# Stage 2: Build the application
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# Enable Corepack
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# Copy source code
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json ./
COPY packages ./packages
COPY apps/mail ./apps/mail

# Install all dependencies (will use cache from deps stage)
RUN pnpm install --frozen-lockfile

# Build the app
WORKDIR /app/apps/mail
RUN pnpm build

# Stage 3: Production image
FROM node:22-alpine AS runner
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# Enable Corepack for pnpm
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# Create data directory
RUN mkdir -p /app/data

# Copy monorepo structure
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/mail/package.json ./apps/mail/
COPY --from=builder /app/apps/mail/build ./apps/mail/build

# Install production dependencies with native modules
RUN pnpm install --frozen-lockfile --prod

# Environment defaults
ENV NODE_ENV=production
ENV PORT=5175
ENV DATABASE_PATH=/app/data/mail.db

EXPOSE 5175

CMD ["node", "apps/mail/build"]
