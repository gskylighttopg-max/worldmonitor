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

## 🏗️ Architecture

```
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

## 📁 Project Structure

```
worldmonitor/
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