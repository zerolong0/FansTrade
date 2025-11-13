#!/bin/bash

set -e

# 配置
NAS_HOST="192.168.0.42"
NAS_USER="zerolong"
NAS_PASSWORD="ddd123456"
PROJECT_NAME="fanstrade"
REMOTE_DIR="/vol1/1000/AIAPP/${PROJECT_NAME}"
DATA_DIR="/vol1/1000/AIAPP/data/${PROJECT_NAME}"

echo "🚀 Starting deployment to NAS..."

# 1. 创建远程目录
echo "📁 Creating remote directories..."
sshpass -p "${NAS_PASSWORD}" ssh ${NAS_USER}@${NAS_HOST} "mkdir -p ${REMOTE_DIR} ${DATA_DIR}"

# 2. 同步代码（排除 node_modules）
echo "📦 Syncing code to NAS..."
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'dist' \
  --exclude '.env.local' \
  --exclude 'frontend/.next' \
  --exclude 'frontend/node_modules' \
  -e "sshpass -p ${NAS_PASSWORD} ssh" \
  ./ ${NAS_USER}@${NAS_HOST}:${REMOTE_DIR}/

# 3. 复制生产环境配置
echo "⚙️  Copying production environment..."
sshpass -p "${NAS_PASSWORD}" scp .env.production ${NAS_USER}@${NAS_HOST}:${REMOTE_DIR}/.env

# 4. 部署 Docker 容器
echo "🐳 Deploying Docker containers..."
sshpass -p "${NAS_PASSWORD}" ssh ${NAS_USER}@${NAS_HOST} << 'ENDSSH'
cd ${REMOTE_DIR}
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
ENDSSH

echo "✅ Deployment complete!"
echo "🌐 Access at: http://${NAS_HOST}:3001"
echo "📊 API: http://${NAS_HOST}:3000"
