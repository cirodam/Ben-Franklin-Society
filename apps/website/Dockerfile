# Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set working directory
WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY turbo.json ./
COPY tsconfig.json ./

# Copy packages
COPY packages ./packages

# Copy website app
COPY apps/website ./apps/website

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build the website
WORKDIR /app/apps/website
RUN pnpm build

# Runtime stage - nginx to serve static files
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/apps/website/build /usr/share/nginx/html

# Copy custom nginx config
COPY apps/website/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
