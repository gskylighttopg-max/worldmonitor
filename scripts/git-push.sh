#!/bin/bash
# git-push.sh - Safe push script for WorldMonitor
# Usage: ./scripts/git-push.sh "commit message" [branch-name]
# Default branch: main

set -e

MSG="${1:-Update}"
BRANCH="${2:-main}"

echo "📝 Commit message: $MSG"
echo "🌿 Branch: $BRANCH"
echo ""

# Show status
git status --short

# Confirm
read -p "Push these changes? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

# Add, commit, push
git add -A
git commit -m "$MSG"
git push origin "$BRANCH"

echo ""
echo "✅ Pushed to origin/$BRANCH"
echo "🔗 View: https://github.com/gskylighttopg-max/worldmonitor"