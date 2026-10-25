#!/bin/bash
# One-command deploy for World Monitor

set -e

echo "🌍 World Monitor Deploy Script"
echo "=============================="

# Check prerequisites
command -v git >/dev/null 2>&1 || { echo "❌ git required"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ node required"; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "❌ python3 required"; exit 1; }

# Check for .env
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found!"
    echo "Copy .env.example to .env and add your API keys:"
    echo "  cp .env.example .env"
    echo "  # Edit .env with your keys"
    exit 1
fi

echo "✅ Prerequisites checked"

# Install Python deps
echo "📦 Installing Python dependencies..."
cd ingest
python3 -m venv venv 2>/dev/null || true
source venv/bin/activate
pip install -q -r requirements.txt
cd ..

# Install Node deps for frontend
echo "📦 Installing frontend dependencies..."
cd frontend
npm install --silent
cd ..

# Test ingest
echo "🧪 Testing ingest..."
cd ingest
source venv/bin/activate
python run_all.py
cd ..

echo "✅ Ingest test passed!"

# Deploy Worker
echo "☁️  Deploying Cloudflare Worker..."
if ! command -v wrangler &> /dev/null; then
    echo "Installing wrangler..."
    npm install -g wrangler
fi

# Check Cloudflare auth
if ! wrangler whoami &> /dev/null; then
    echo "🔐 Please login to Cloudflare:"
    wrangler login
fi

# Create KV namespace if needed
echo "🗄️  Checking KV namespace..."
if ! wrangler kv:namespace list | grep -q "NEWS_KV"; then
    echo "Creating KV namespace..."
    wrangler kv:namespace create "NEWS_KV"
    echo "⚠️  Update wrangler.toml with the returned KV namespace IDs!"
    echo "   Then run: wrangler kv:namespace create \"NEWS_KV\" --preview"
    echo "   Update preview_id in wrangler.toml"
    read -p "Press Enter after updating wrangler.toml..."
fi

# Deploy
wrangler deploy

echo ""
echo "🎉 Deploy complete!"
echo ""
echo "📋 Next steps:"
echo "1. Mana deploys frontend to Vercel:"
echo "   cd frontend && vercel --prod"
echo ""
echo "2. Set Vercel env var:"
echo "   VITE_API_URL=https://your-worker.your-subdomain.workers.dev"
echo ""
echo "3. Configure RSSHub webhook:"
echo "   URL: https://your-worker.workers.dev/webhook/rss?token=YOUR_SECRET"
echo ""
echo "4. Test API:"
echo "   curl https://your-worker.workers.dev/api/conflict"
echo ""
echo "🎉 World Monitor is live!"