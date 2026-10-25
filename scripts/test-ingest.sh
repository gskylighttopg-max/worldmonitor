#!/bin/bash
# Test ingest locally

set -e

echo "🧪 Testing ingest..."

cd "$(dirname "$0")/../ingest"

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate

echo "Installing dependencies..."
pip install -r requirements.txt

# Check for .env
if [ ! -f "../.env" ]; then
    echo "⚠️  No .env file found. Copy .env.example to .env and add your API keys."
    exit 1
fi

export $(cat ../.env | xargs)

echo "Running ingest..."
python run_all.py

echo "✅ Ingest test complete!"
echo "Check data/ folder for JSON output"