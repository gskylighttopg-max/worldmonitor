# Dockerfile for WorldMonitor Dev Container
# Used by .devcontainer/devcontainer.json and docker-compose.yml

FROM mcr.microsoft.com/devcontainers/javascript-node:20-bookworm

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    ca-certificates \
    gnupg \
    lsb-release \
    && rm -rf /var/lib/apt/lists/*

# Install Cloudflare cloudflared
RUN mkdir -p /usr/share/keyrings && \
    curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null && \
    echo "deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared $(lsb_release -cs) main" | tee /etc/apt/sources.list.d/cloudflared.list && \
    apt-get update && apt-get install -y cloudflared && \
    rm -rf /var/lib/apt/lists/*

# Install 1Password CLI (for secrets)
RUN curl -sS https://downloads.1password.com/linux/keys/1password.asc | gpg --dearmor --output /usr/share/keyrings/1password-archive-keyring.gpg && \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/1password-archive-keyring.gpg] https://downloads.1password.com/linux/debian/$(dpkg --print-architecture) stable main" | tee /etc/apt/sources.list.d/1password.list && \
    apt-get update && apt-get install -y 1password-cli && \
    rm -rf /var/lib/apt/lists/*

# Install Bitwarden CLI (alternative)
RUN curl -fsSL https://vault.bitwarden.com/download/?app=cli&platform=linux | bash -s -- -d /usr/local/bin

# Install pnpm globally
RUN corepack enable pnpm && corepack prepare pnpm@latest --activate

# Install Ruflo globally
RUN pnpm add -g ruflo@latest

# Create workspace directory
WORKDIR /workspace

# Copy package files first for caching
COPY package.json pnpm-lock.yaml* ./
COPY scripts/package.json scripts/pnpm-lock.yaml* ./scripts/

# Install dependencies (cached layer)
RUN pnpm install --frozen-lockfile 2>/dev/null || pnpm install
RUN cd scripts && pnpm install --frozen-lockfile 2>/dev/null || pnpm install

# Copy rest of project
COPY . .

# Set up non-root user
USER node

# Default command
CMD ["sleep", "infinity"]