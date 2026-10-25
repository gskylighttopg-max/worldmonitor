#!/bin/bash
# Deploy Cloudflare Worker

set -e

echo "🚀 Deploying Cloudflare Worker..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "Installing wrangler..."
    npm install -g wrangler
fi

# Check if logged in
if ! wrangler whoami &> /dev/null; then
    echo "Please login to Cloudflare:"
    wrangler login
fi

# Deploy
echo "Deploying worker..."
wrangler deploy

echo "✅ Worker deployed!"
echo "🔗 Your API: https://your-worker.your-subdomain.workers.dev"