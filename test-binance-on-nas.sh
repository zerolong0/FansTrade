#!/bin/bash

# Test Binance Integration on NAS
# This script deploys the backend to NAS and runs Binance API tests

set -e

NAS_HOST="192.168.0.42"
NAS_USER="zerolong"
NAS_PASSWORD="ddd123456"
NAS_PROJECT_DIR="/vol1/1000/AIAPP/fanstrade"
LOCAL_DIR="/Users/zerolong/Documents/AICODE/newbe/fanstrade"

echo "🚀 Testing Binance Integration on NAS..."
echo ""

# Step 1: Sync files to NAS (incremental)
echo "📦 Step 1: Syncing files to NAS..."
sshpass -p "$NAS_PASSWORD" rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude 'dist' \
  --exclude '.next' \
  --exclude '.git' \
  --exclude 'frontend' \
  "$LOCAL_DIR/" "${NAS_USER}@${NAS_HOST}:${NAS_PROJECT_DIR}/"

echo "✅ Files synced"
echo ""

# Step 2: Install dependencies and build on NAS
echo "📦 Step 2: Installing dependencies on NAS..."
sshpass -p "$NAS_PASSWORD" ssh "${NAS_USER}@${NAS_HOST}" << 'EOF'
cd /vol1/1000/AIAPP/fanstrade

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

echo "✅ Dependencies ready"
EOF

echo ""

# Step 3: Run Binance test script
echo "🧪 Step 3: Running Binance API test..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

sshpass -p "$NAS_PASSWORD" ssh "${NAS_USER}@${NAS_HOST}" << 'EOF'
cd /vol1/1000/AIAPP/fanstrade

# Set environment variables
export NODE_ENV=development
export DATABASE_URL="postgresql://tradefans:password@localhost:5432/tradefans?schema=public"
export REDIS_URL="redis://localhost:6379"
export ENCRYPTION_KEY="a7daf8112759c00ea7b3734d5a88e1a7206542a776112abf7e307db6c504322f"

# Run test script
npx tsx src/scripts/test-binance.ts
EOF

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Binance test completed!"
echo ""
echo "📊 Next steps:"
echo "  1. If test passed: Continue with Phase 2.2 (WebSocket)"
echo "  2. If test failed with geo-restriction: Consider using Binance testnet"
echo "  3. Check logs above for detailed results"
