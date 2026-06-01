# BFS Website

Simple informational website for benfranklinsociety.org introducing people to the concept.

## Pages

- **Home** (`/`) - Introduction to BFS, philosophy, and key features
- **FAQ** (`/faq`) - Frequently asked questions

## Technology

- **SvelteKit** with static site generation (`adapter-static`)
- **Nginx** for serving static files in production
- **Docker** for containerized deployment

## Development

```bash
# Install dependencies (from monorepo root)
pnpm install

# Start dev server
cd apps/website
pnpm dev

# Visit http://localhost:5180
```

## Building

```bash
# Build static site
pnpm build

# Preview production build
pnpm preview
```

The built site will be in `apps/website/build/`.

## Deployment

### Option 1: Bootstrap Script (Recommended)

Deploy to a fresh Ubuntu 22.04 LTS server:

```bash
curl -fsSL https://raw.githubusercontent.com/cirodam/Ben-Franklin-Society/master/scripts/bootstrap-website-droplet.sh | sudo bash
```

Then start the website:

```bash
cd /opt/bfs-website && ./start.sh
```

The website will be accessible at `http://YOUR_SERVER_IP`

### Option 2: Manual Docker Deployment

Build and push the Docker image:

```bash
# From monorepo root
./scripts/publish-website-image.sh
```

Deploy on your server:

```bash
# Download docker-compose file
mkdir -p /opt/bfs-website
cd /opt/bfs-website
curl -fsSL https://raw.githubusercontent.com/cirodam/Ben-Franklin-Society/master/docker-compose.website.yml -o docker-compose.yml

# Start
docker compose up -d
```

### SSL/Domain Setup

The bootstrap script includes a Caddyfile configured for `benfranklinsociety.org`. To enable SSL:

1. Point your domain DNS A record to your server IP
2. Caddy will automatically provision Let's Encrypt certificates
3. Visit https://benfranklinsociety.org

## Architecture

- **Static Site**: All pages pre-rendered at build time
- **No Database**: Pure HTML/CSS/JS
- **Nginx**: Serves static files in production
- **Minimal**: No backend, no authentication needed

This is intentionally simple—just a marketing/info site, not part of the governance platform.
