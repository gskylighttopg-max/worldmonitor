<<<<<<< HEAD
# World Monitor

Real-time geopolitical intelligence dashboard with live conflict monitoring, energy tracking, and trade analysis.

## 🚀 Quick Start

```bash
# Clone and setup
git clone https://github.com/yourusername/worldmonitor
cd worldmonitor

# Add your API keys
cp .env.example .env
# Edit .env with your keys

# Deploy everything
./deploy.sh
```

## 📊 Features

- **Live Conflict Monitoring**: GDELT + RSS webhooks (~30 sec latency)
- **Energy Markets**: EIA oil prices, rig counts, inventories
- **Trade Intelligence**: WTO disputes, UN Comtrade, USITC tariffs
- **Vessel Tracking**: AIS tanker positions at chokepoints
- **Conflict Detection**: Narrative divergence analysis across sources
- **Interactive Map**: MapLibre GL JS with clustering, popups, country drill-down
=======
# WorldMonitor

Real-time world monitoring AI with collaborative multi-agent orchestration.

## 🚀 Quick Start

### **Option A: Core Team (Direct Clone)**
```bash
# Clone directly
git clone https://github.com/YOUR_USERNAME/worldmonitor
cd worldmonitor
pnpm install
cd scripts && pnpm install

# Initialize Ruflo (one-time)
ruflo init --yes
ruflo daemon start
ruflo swarm init --topology hierarchical --max-agents 8

# Start all services (Windows)
.\scripts\start-all.bat

# Start all services (Mac/Linux)
./scripts/start-all.sh
```

### **Option B: Contributors (Fork → Clone → PR)**
```bash
# 1. Fork on GitHub: https://github.com/YOUR_USERNAME/worldmonitor/fork
# 2. Clone YOUR fork
git clone https://github.com/YOUR_GITHUB_USERNAME/worldmonitor
cd worldmonitor
pnpm install
cd scripts && pnpm install

# 3. Create feature branch
git checkout -b feat/your-feature-name

# 4. Make changes, commit, push
git add -A
git commit -m "Add: your feature description"
git push origin feat/your-feature-name

# 5. Open PR on GitHub: https://github.com/YOUR_USERNAME/worldmonitor/compare
```

## 👥 Team Collaboration

**4 developers, separate machines, real-time pair programming**

| Tool | Purpose | Cost |
|------|---------|------|
| VS Code Live Share | Real-time code editing, shared terminal | Free |
| Cloudflare Tunnel | Expose localhost to team/stakeholders | Free |
| 1Password CLI | Shared API keys, secrets injection | Free |
| GitHub Codespaces | Zero-setup cloud dev environment | Free tier |

See [COLLABORATION_SETUP.md](COLLABORATION_SETUP.md) for full guide.
>>>>>>> 74c655ffc68a8acc0ef3e754c6d855e934908f42

## 🏗️ Architecture

```
<<<<<<< HEAD
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│  GitHub Actions │────►│  Cloudflare KV   │◄───►│  Cloudflare │
│  (Cron: 2 min)  │     │  (1GB free)      │     │  Workers    │
└─────────────────┘     └──────────────────┘     └──────┬──────┘
                                                        │
                        ┌──────────────────┐            │
                        │    RSSHub        │────────────┘
                        │  (Webhooks)      │
                        └──────────────────┘
                                                        │
                        ┌──────────────────┐            │
                        │  Frontend        │◄───────────┘
                        │  (Vercel)        │
                        └──────────────────┘
```

## 🔑 Required API Keys

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| NewsAPI | Global news | 100/day |
| GNews | Global news | 100/day |
| EIA | Energy data | 5,000/day |
| Comtrade | Trade data | 100/day |
| Alpha Vantage | Commodities | 25/day |
| AISStream | Vessel tracking | Freemium |

## 🚀 Deployment

### 1. Cloudflare Worker (API)
```bash
# Login to Cloudflare
wrangler login

# Deploy
wrangler deploy
```

### 2. RSSHub (Webhooks)
Deploy on Railway/Render/Oracle Free Tier:
```bash
# Configure webhook URL in RSSHub:
# https://your-worker.workers.dev/webhook/rss?token=YOUR_SECRET
```

### 3. Frontend (Vercel)
```bash
cd frontend
vercel --prod
# Set VITE_API_URL env var
```

### 4. GitHub Actions (Cron)
Runs automatically every 2 minutes via Cloudflare Cron Triggers.

## 📡 API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/conflict` | Conflict events (GeoJSON) |
| `GET /api/oil?type=price|inventory|rigs` | Oil market data |
| `GET /api/news?country=US&limit=20` | News by country |
| `GET /api/conflicts?minScore=0.6` | Conflicting narratives |
| `POST /webhook/rss` | RSSHub webhook endpoint |

## 🗺️ Map Features

- **Clustered Markers**: Auto-clustering at zoom levels
- **Conflict Popups**: Article lists with sentiment
- **Country Click**: Drill-down to country news
- **Oil Infrastructure**: Rigs, refineries, tankers
- **Heatmaps**: Event density visualization
- **Smart Polling**: 10s (breaking) → 60s (quiet)
=======
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Website    │     │  MCP HTTP   │     │   Ruflo     │
│  :3000      │     │  Wrapper    │     │   CLI       │
│  (Next.js)  │     │  :3001      │     │  (daemon,   │
└──────┬──────┘     └──────┬──────┘     │   swarm,    │
       │                   │            │   agents,   │
       └───────────────────┼────────────│   memory)   │
                           ▼            └─────────────┘
                    ┌─────────────┐
                    │ Cloudflare  │
                    │ Tunnel      │
                    │ (free)      │
                    └──────┬──────┘
                           ▼
              ┌────────────────────────┐
              │ https://app.dev        │
              │ https://mcp.dev        │
              └────────────────────────┘
```

## 🤖 Ruflo MCP Tools (333 Available)

- **Agent**: `agent_spawn`, `agent_execute`, `agent_list`, `agent_pool`
- **Swarm**: `swarm_init`, `swarm_status`, `swarm_health`
- **Memory**: `memory_store`, `memory_search`, `memory_list` (HNSW vector)
- **Hooks**: `hooks_intelligence`, `hooks_route`, `hooks_explain`, `hooks_model_route`
- **Tasks**: `task_create`, `task_assign`, `task_complete`
- **Intelligence**: 4-step pipeline (RETRIEVE→JUDGE→DISTILL→CONSOLIDATE)
- **And 300+ more...**
>>>>>>> 74c655ffc68a8acc0ef3e754c6d855e934908f42

## 📁 Project Structure

```
worldmonitor/
<<<<<<< HEAD
├── .github/workflows/     # GitHub Actions
├── ingest/                # Python data ingest
│   ├── run_all.py
│   ├── *.py              # 15+ API fetchers
│   └── utils/
├── workers/               # Cloudflare Worker
│   ├── api.js
│   ├── routes/
│   └── utils/
├── frontend/              # MapLibre frontend
│   ├── src/
│   │   ├── map/          # MapLibre components
│   │   ├── ui/           # UI components
│   │   └── utils/
│   └── public/
├── workers/               # Cloudflare Worker
├── scripts/               # Deploy scripts
├── wrangler.toml          # Worker config
├── vercel.json           # Vercel config
└── deploy.sh             # One-command deploy
```

## 🔧 Configuration

### Environment Variables
```bash
# .env
NEWSAPI_KEY=xxx
GNEWS_KEY=xxx
EIA_KEY=xxx
COMTRADE_KEY=xxx
ALPHA_KEY=xxx
AISSTREAM_KEY=xxx
WEBHOOK_SECRET=random_string
CF_ACCOUNT_ID=xxx
CF_API_TOKEN=xxx
CF_KV_NAMESPACE_ID=xxx
```

### Cloudflare KV Namespace
```bash
wrangler kv:namespace create "NEWS_KV"
# Add namespace ID to wrangler.toml
```

## 📊 Data Sources

| Category | Sources |
|----------|---------|
| Conflict | GDELT, Reuters, AP, BBC, Al Jazeera, Reddit |
| Energy | EIA, OPEC, IEA, RigCount, OilPrice.com |
| Trade | WTO, UN Comtrade, USITC, EU Trade Helpdesk |
| Vessels | AISStream, MarineTraffic (if licensed) |

## 🛡️ Legal Compliance

- ✅ RSS feeds: Headline + snippet only, link to source
- ✅ GDELT: Public domain, machine-coded
- ✅ Government APIs: Public domain (EIA, Comtrade, WTO)
- ❌ No full-text redistribution
- ❌ No paywalled content
- ❌ No commercial use of non-commercial APIs

## 💰 Cost

**$0/month forever** on free tiers:
- Cloudflare Workers: 100K req/day
- Cloudflare KV: 1GB, 100K reads/day
- GitHub Actions: 4,000 min/mo (use Cloudflare Cron instead)
- Vercel: Unlimited personal
- RSSHub: Free on Railway/Render/Oracle

## 🚨 Monitoring

- UptimeRobot: Monitor API + RSSHub (free)
- Cloudflare Analytics: Worker performance
- GitHub Actions: Ingest logs

## 📝 License

MIT License - See LICENSE file
=======
├── .cloudflared/           # Cloudflare Tunnel config
├── .devcontainer/          # GitHub Codespaces / Dev Container
├── .vscode/                # VS Code tasks, launch, settings
├── scripts/
│   ├── mcp-http-wrapper.js # MCP stdio → HTTP bridge
│   ├── start-all.sh        # Mac/Linux startup
│   └── start-all.bat       # Windows startup
├── docker-compose.yml      # Shared container option
├── .env.example            # Secrets template
├── TEAM_ONBOARDING.md      # Team setup guide
├── COLLABORATION_SETUP.md  # Architecture & workflow
└── .gitignore
```

## 🔐 Secrets Management

```bash
# Install 1Password CLI
brew install 1password-cli

# Sign in
op signin

# Use with any command
op run -- npx ruflo mcp start
op run -- pnpm dev
```

## 📚 Documentation

- [Collaboration Setup](COLLABORATION_SETUP.md) - Architecture, workflow, troubleshooting
- [Team Onboarding](TEAM_ONBOARDING.md) - Step-by-step for each developer
- [Ruflo Docs](https://github.com/ruvnet/ruflo) - MCP tools, agents, swarms

## 🛠️ VS Code Tasks (Cmd+Shift+P → "Tasks: Run Task")

- `WorldMonitor: Start All Services`
- `WorldMonitor: Start Website Dev Server`
- `WorldMonitor: Start MCP HTTP Wrapper`
- `WorldMonitor: Ruflo Status`
- `WorldMonitor: Spawn Research Agent`
- `WorldMonitor: Memory Search`
- `WorldMonitor: Run Intelligence Pipeline`

## 🐛 Troubleshooting

| Issue | Fix |
|-------|-----|
| Port busy | `ruflo daemon stop` + kill port |
| MCP not connecting | `ruflo doctor --fix` |
| Tunnel 502 | Check local server, verify config.yml |
| Live Share lag | Disable unused extensions |

## 📄 License

MIT
>>>>>>> 74c655ffc68a8acc0ef3e754c6d855e934908f42
