# WorldMonitor Team Onboarding Checklist
# Each developer completes these steps

## Prerequisites (One-time)
- [ ] Git installed
- [ ] Node.js 20+ installed (or use DevContainer)
- [ ] VS Code installed
- [ ] VS Code "Live Share" extension installed
- [ ] Cloudflare account (free)
- [ ] GitHub account

## Option A: VS Code Live Share + Local Dev (Recommended)

### 1. Clone & Setup
```bash
git clone <repo-url> worldmonitor
cd worldmonitor
pnpm install
cd scripts && pnpm install
```

### 2. Initialize Ruflo
```bash
ruflo init --yes
ruflo daemon start
ruflo swarm init --topology hierarchical --max-agents 8
```

### 3. Start Dev Servers (Terminal 1)
```bash
# Website dev server
npm run dev
# Or if Next.js: pnpm dev
```

### 4. Start MCP Wrapper (Terminal 2)
```bash
cd scripts
npm start
# Runs on http://localhost:3001
```

### 5. Start Cloudflare Tunnel (Terminal 3)
```bash
# First time only:
cloudflared tunnel login
cloudflared tunnel create worldmonitor-dev
# Edit ~/.cloudflared/config.yml with your tunnel ID

# Every session:
cloudflared tunnel run worldmonitor-dev
# Exposes:
#   https://app.worldmonitor.dev → localhost:3000
#   https://mcp.worldmonitor.dev → localhost:3001
```

### 6. Start Live Share Session
- VS Code → Live Share → "Share" → "Invite Others"
- Send link to team (expires in 30 days)
- Team clicks link → joins instantly

### 7. Configure Secrets (1Password CLI)
```bash
# Install 1Password CLI
brew install 1password-cli  # macOS
# winget install 1Password.1PasswordCLI  # Windows

# Sign in
op signin

# Verify access to shared vault
op vault list
op item list --vault "WorldMonitor API Keys"

# Test injection
op run -- echo "OpenAI key: $OPENAI_API_KEY"
```

---

## Option B: GitHub Codespaces (Zero-setup fallback)

1. Open repo on GitHub → "Code" → "Codespaces" → "Create codespace on main"
2. Wait for build (2-3 min)
3. Dev container auto-runs setup.sh
4. Ports 3000, 3001 auto-forwarded
5. Share Codespace URL with team (or use Live Share inside Codespace)

---

## Option C: Shared Docker Container (VPS)

If team has a shared VPS (Hetzner/DigitalOcean ~$5/mo):

```bash
# On VPS:
git clone <repo>
cd worldmonitor
cp .env.example .env  # Fill in secrets
docker-compose up -d dev

# Team connects via VS Code:
# "Remote-SSH" → connect to VPS → "Attach to Container" → worldmonitor-dev
```

---

## Daily Workflow

### Mob Programming Session
1. **Host** starts Live Share
2. **Host** runs `npm run dev` + `cd scripts && npm start`
3. **Host** runs `cloudflared tunnel run worldmonitor-dev`
4. **Team** joins Live Share → everyone edits together
5. **Anyone** runs commands in shared terminal
6. **Changes** auto-sync via git

### Async Work
1. `git checkout -b feature/xyz`
2. Make changes
3. `git push origin feature/xyz`
4. Open PR → Vercel preview deploy auto-created
5. Team reviews via preview URL
6. Merge → auto-deploys to production

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Port 3000 in use" | `lsof -ti:3000 \| xargs kill -9` |
| MCP wrapper won't connect | Check `ruflo mcp status`, restart daemon |
| Cloudflare tunnel 502 | Verify local server running, check config.yml |
| Live Share lag | Reduce extensions, use VS Code Web |
| Secrets not loading | `op signin` again, check vault permissions |

---

## Useful Commands Cheatsheet

```bash
# Ruflo
ruflo status                    # System status
ruflo agent list                # List agents
ruflo agent spawn -t researcher # Spawn agent
ruflo task create -t research -d "..."  # Create task
ruflo memory search -q "..."    # Semantic search
ruflo mcp tools                 # List MCP tools

# Development
npm run dev                     # Website
cd scripts && npm start         # MCP wrapper
cloudflared tunnel run ...      # Tunnel

# Git
git status
git add -A && git commit -m "msg"
git push origin branch

# Docker
docker-compose up -d dev        # Start shared container
docker-compose logs -f dev      # View logs
docker-compose exec dev bash    # Shell into container
```

---

## Team Roles

| Role | Responsibilities |
|------|------------------|
| **Host** | Runs servers, tunnel, starts Live Share |
| **Driver** | Types code during mob session |
| **Navigator** | Reviews, suggests, researches |
| **Observer** | Learns, takes notes, spots issues |
| **Rotate** | Every 20-30 min |

---

## Security Notes

- **Never commit .env** - Use `.env.example` as template
- **API keys in 1Password/Bitwarden** - Not in code
- **Cloudflare Access** - Restrict tunnel to team emails
- **Tailscale (optional)** - For SSH/DB access to VPS
- **Rotate keys** - Monthly or when team changes

---

## Support

- Ruflo docs: https://github.com/ruvnet/ruflo
- Live Share docs: https://code.visualstudio.com/learn/collaboration/live-share
- Cloudflare Tunnel: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/
- DevContainers: https://containers.dev/