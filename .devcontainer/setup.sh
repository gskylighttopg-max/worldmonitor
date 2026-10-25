#!/bin/bash
# DevContainer Post-Create Setup for WorldMonitor
# Runs automatically when container starts

set -e

echo "🚀 Setting up WorldMonitor dev environment..."

# 1. Install pnpm (if not present)
if ! command -v pnpm &> /dev/null; then
  echo "📦 Installing pnpm..."
  corepack enable pnpm
  corepack prepare pnpm@latest --activate
fi

# 2. Install project dependencies
echo "📦 Installing project dependencies..."
cd /workspaces/$(basename "$PWD")
pnpm install --frozen-lockfile 2>/dev/null || pnpm install

# 3. Install MCP wrapper dependencies
echo "📦 Installing MCP HTTP wrapper..."
cd scripts
pnpm install 2>/dev/null || pnpm install
cd ..

# 4. Install Ruflo globally (for CLI access)
echo "🔧 Installing Ruflo CLI..."
pnpm add -g ruflo@latest

# 5. Verify Ruflo installation
echo "✅ Verifying Ruflo..."
ruflo --version

# 6. Initialize Ruflo if not already done
if [ ! -f ".mcp.json" ]; then
  echo "🔧 Initializing Ruflo..."
  ruflo init --yes
fi

# 7. Start background services
echo "🚀 Starting Ruflo daemon..."
ruflo daemon start

echo "🚀 Initializing swarm..."
ruflo swarm init --topology hierarchical --max-agents 8

# 8. Setup Cloudflare tunnel (if credentials exist)
if [ -f "$HOME/.cloudflared/config.yml" ] && [ -f "$HOME/.cloudflared/cert.pem" ]; then
  echo "☁️  Cloudflare credentials found. Starting tunnel..."
  cloudflared tunnel run worldmonitor-dev &
  echo "Tunnel started in background"
else
  echo "⚠️  Cloudflare credentials not found. Run 'cloudflared tunnel login' to set up."
fi

# 9. Create useful aliases
cat >> ~/.bashrc << 'EOF'

# WorldMonitor aliases
alias wm:dev:web="npm run dev:website"
alias wm:dev:mcp="npm run dev:mcp"
alias wm:dev:all="npm run dev:all"
alias wm:tunnel="cloudflared tunnel run worldmonitor-dev"
alias wm:ruflo="ruflo"
alias wm:swarm="ruflo swarm"
alias wm:agent="ruflo agent"
alias wm:task="ruflo task"
alias wm:memory="ruflo memory"
alias wm:mcp="ruflo mcp"
alias wm:status="ruflo status"
alias wm:doctor="ruflo doctor --fix"
EOF

echo ""
echo "✅ Setup complete!"
echo ""
echo "Available commands:"
echo "  wm:dev:web   - Start website dev server (port 3000)"
echo "  wm:dev:mcp   - Start MCP HTTP wrapper (port 3001)"
echo "  wm:dev:all   - Start both"
echo "  wm:tunnel    - Start Cloudflare tunnel"
echo "  wm:ruflo     - Ruflo CLI"
echo "  wm:status    - Show Ruflo status"
echo ""
echo "Next steps:"
echo "  1. Run 'wm:dev:all' to start dev servers"
echo "  2. Run 'wm:tunnel' to expose via Cloudflare"
echo "  3. Share VS Code Live Share session for real-time collab"
echo ""