#!/bin/bash
# start-all.sh - Start all WorldMonitor services for collaborative development
# Usage: ./scripts/start-all.sh

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           WorldMonitor Collaborative Dev Startup             ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check prerequisites
check_command() {
  if ! command -v "$1" &> /dev/null; then
    echo -e "${RED}✗ $1 not found. Please install it first.${NC}"
    exit 1
  fi
}

echo -e "${YELLOW}Checking prerequisites...${NC}"
check_command node
check_command pnpm
check_command ruflo
check_command cloudflared

echo -e "${GREEN}✓ All prerequisites found${NC}"
echo ""

# Load .env if exists
if [ -f .env ]; then
  echo -e "${YELLOW}Loading .env...${NC}"
  export $(grep -v '^#' .env | xargs)
fi

# Function to cleanup on exit
cleanup() {
  echo ""
  echo -e "${YELLOW}Shutting down...${NC}"
  # Kill background jobs
  jobs -p | xargs -r kill 2>/dev/null
  ruflo daemon stop 2>/dev/null || true
  echo -e "${GREEN}Done.${NC}"
}
trap cleanup EXIT INT TERM

# 1. Start Ruflo Daemon
echo -e "${YELLOW}1/5 Starting Ruflo daemon...${NC}"
ruflo daemon start
sleep 2

# 2. Initialize/Verify Swarm
echo -e "${YELLOW}2/5 Initializing swarm...${NC}"
if ! ruflo swarm status &>/dev/null; then
  ruflo swarm init --topology hierarchical --max-agents 8
else
  echo "Swarm already running"
fi

# 3. Start Website Dev Server (background)
echo -e "${YELLOW}3/5 Starting website dev server (port 3000)...${NC}"
if [ -f package.json ] && grep -q '"dev"' package.json; then
  pnpm run dev &
  WEBSITE_PID=$!
  echo "Website PID: $WEBSITE_PID"
else
  echo -e "${YELLOW}⚠ No dev script in package.json, skipping website${NC}"
fi

# 4. Start MCP HTTP Wrapper (background)
echo -e "${YELLOW}4/5 Starting MCP HTTP wrapper (port 3001)...${NC}"
cd scripts
npm start &
MCP_PID=$!
cd ..
echo "MCP Wrapper PID: $MCP_PID"

# Wait for services to be ready
echo -e "${YELLOW}Waiting for services...${NC}"
sleep 3

# 5. Start Cloudflare Tunnel
echo -e "${YELLOW}5/5 Starting Cloudflare tunnel...${NC}"
if [ -f ~/.cloudflared/config.yml ]; then
  echo "Starting tunnel (will run in foreground)..."
  echo -e "${GREEN}Tunnel URLs will appear below:${NC}"
  echo -e "${BLUE}  Website: https://app.worldmonitor.dev${NC}"
  echo -e "${BLUE}  MCP:     https://mcp.worldmonitor.dev${NC}"
  echo ""
  echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
  echo ""
  
  # Run tunnel in foreground (shows URLs)
  cloudflared tunnel run worldmonitor-dev
else
  echo -e "${RED}Cloudflare config not found at ~/.cloudflared/config.yml${NC}"
  echo "Run: cloudflared tunnel login && cloudflared tunnel create worldmonitor-dev"
  echo "Then edit ~/.cloudflared/config.yml"
  
  # Keep script running so background processes stay alive
  wait
fi