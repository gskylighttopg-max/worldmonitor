# WorldMonitor Collaborative Development Setup

## Overview
This project is configured for **4 developers on separate machines** to do **real-time pair/mob programming** on:
- **Website** (Next.js/React frontend)
- **Ruflo MCP Servers** (333 tools for AI orchestration)
- **AI API Keys & Plugins** (managed via 1Password/Bitwarden)

All using **free tools** with **no rate limits**.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    TEAM COLLABORATION LAYER                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │
│  │  Dev 1      │  │  Dev 2      │  │  Dev 3      │  │  Dev 4  │ │
│  │  (Host)     │  │  (Driver)   │  │  (Nav)      │  │  (Obs)  │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └────┬────┘ │
│         │                │                │               │      │
│         └────────────────┼────────────────┼───────────────┘      │
│                          ▼                ▼                      │
│              ┌─────────────────────────────────────────┐         │
│              │        VS CODE LIVE SHARE (FREE)        │         │
│              │  • Real-time code editing               │         │
│              │  • Shared terminal                      │         │
│              │  • Shared localhost ports               │         │
│              │  • Audio/video calls                    │         │
│              └─────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PUBLIC ACCESS LAYER                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │           CLOUDFLARE TUNNEL (FREE, NO LIMITS)           │   │
│  │  https://app.worldmonitor.dev  →  localhost:3000        │   │
│  │  https://mcp.worldmonitor.dev  →  localhost:3001        │   │
│  │  https://api.worldmonitor.dev  →  localhost:3002        │   │
│  │  Cloudflare Access (free 50 users) → Team SSO           │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                       LOCAL SERVICES                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Website      │  │ MCP HTTP     │  │ Ruflo CLI            │  │
│  │ Dev Server   │  │ Wrapper      │  │ (daemon, swarm,      │  │
│  │ :3000        │  │ :3001        │  │  agents, memory)     │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Quick Start (5 minutes)

### For the Host (starts the session)

```bash
# 1. Clone & setup (one time)
git clone <repo> worldmonitor
cd worldmonitor
pnpm install
cd scripts && pnpm install

# 2. Initialize Ruflo (one time)
ruflo init --yes
ruflo daemon start
ruflo swarm init --topology hierarchical --max-agents 8

# 3. Start everything
# Windows:
.\scripts\start-all.bat

# Mac/Linux:
./scripts/start-all.sh
```

### For Team Members (join the session)

1. **Click the Live Share link** sent by host
2. **VS Code opens** → you're in the session
3. **Edit code together** in real-time
4. **Use shared terminal** to run commands

---

## File Structure Created

```
worldmonitor/
├── .cloudflared/
│   └── config.yml              # Cloudflare Tunnel config
├── .devcontainer/
│   ├── devcontainer.json       # GitHub Codespaces config
│   ├── Dockerfile              # Dev container image
│   └── setup.sh                # Auto-run on container start
├── scripts/
│   ├── mcp-http-wrapper.js     # MCP stdio → HTTP bridge
│   ├── package.json            # Wrapper dependencies
│   ├── start-all.sh            # Mac/Linux startup
│   └── start-all.bat           # Windows startup
├── docker-compose.yml          # Shared container option
├── .env.example                # Secrets template
├── TEAM_ONBOARDING.md          # Complete team guide
└── COLLABORATION_SETUP.md      # This file
```

---

## Services & Ports

| Service | Local Port | Tunnel URL | Purpose |
|---------|------------|------------|---------|
| Website Dev | 3000 | `https://app.worldmonitor.dev` | Frontend |
| MCP Wrapper | 3001 | `https://mcp.worldmonitor.dev` | AI tools |
| Ruflo API | 3002 | `https://api.worldmonitor.dev` | CLI API |
| Cloudflare Metrics | 8080 | - | Tunnel health |

---

## Secrets Management (1Password CLI - Free)

### Setup (one time per developer)
```bash
# Install
brew install 1password-cli          # Mac
winget install 1Password.1PasswordCLI  # Windows

# Sign in
op signin

# Verify access
op vault list
op item list --vault "WorldMonitor API Keys"
```

### Usage
```bash
# Inject secrets at runtime
op run -- npx ruflo mcp start
op run -- pnpm dev

# Or in .env (gitignored):
OPENAI_API_KEY=op://WorldMonitor/OpenAI/credential
```

---

## Daily Workflow

### Mob Programming (2-4 hours)
| Time | Activity |
|------|----------|
| 0:00 | Host starts `start-all.bat`, shares Live Share link |
| 0:05 | Team joins, host explains goal |
| 0:10 | Rotate driver every 20 min |
| 2:00 | Commit & push |
| 2:05 | Vercel preview auto-deploys |
| 2:10 | Stakeholders review via `https://app.worldmonitor.dev` |

### Async Work
```bash
# Feature branch
git checkout -b feature/energy-dashboard

# Work locally (no Live Share needed)
# ... code ...

# Push for review
git push origin feature/energy-dashboard
# → GitHub Actions → Vercel Preview URL

# Team reviews preview
# Merge → production deploy
```

---

## Cloudflare Tunnel Setup (Host only, one time)

```bash
# 1. Install
winget install Cloudflare.cloudflared  # Windows
brew install cloudflare/cloudflare/cloudflared  # Mac

# 2. Login (opens browser)
cloudflared tunnel login

# 3. Create tunnel
cloudflared tunnel create worldmonitor-dev

# 4. Copy Tunnel ID from output, edit ~/.cloudflared/config.yml:
# tunnel: <YOUR_TUNNEL_ID>
# credentials-file: ~/.cloudflared/<TUNNEL_ID>.json

# 5. Add DNS (optional, for custom domain)
# cloudflared tunnel route dns worldmonitor-dev app.yourdomain.com

# 6. Test
cloudflared tunnel run worldmonitor-dev
# Should show: https://app.worldmonitor.dev, https://mcp.worldmonitor.dev
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 3000 busy | `lsof -ti:3000 \| xargs kill -9` (Mac/Linux) or `netstat -ano \| findstr :3000` then `taskkill /PID <pid> /F` (Windows) |
| MCP not connecting | `ruflo mcp status`, `ruflo daemon stop && ruflo daemon start` |
| Tunnel 502 | Check local server running, verify config.yml ports |
| Live Share lag | Close unused VS Code extensions, try VS Code Web |
| Secrets not loading | `op signin`, check vault permissions |
| Ruflo commands fail | `ruflo doctor --fix` |

---

## Free Tier Limits

| Service | Limit |
|---------|-------|
| VS Code Live Share | Unlimited sessions, 30-day link expiry |
| Cloudflare Tunnel | Unlimited bandwidth, 50 users Access |
| Cloudflare Workers | 100k requests/day |
| GitHub Codespaces | 60 hours/month (personal) |
| 1Password CLI | Free for families/teams |
| Bitwarden | Free org unlimited |
| Vercel | 100GB bandwidth, unlimited personal |

---

## Next Steps

1. **Team onboarding**: Share `TEAM_ONBOARDING.md` with all 4 developers
2. **Host runs**: `.\scripts\start-all.bat`
3. **Team joins**: Click Live Share link
4. **Start building**: WorldMonitor website + AI agents

---

## Support

- **Ruflo**: https://github.com/ruvnet/ruflo
- **Live Share**: https://code.visualstudio.com/learn/collaboration/live-share
- **Cloudflare Tunnel**: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/
- **DevContainers**: https://containers.dev/