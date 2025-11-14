#!/bin/bash

# FansTrade NAS Deployment Script
# Deploy to: 192.168.0.42:/vol1/1000/AIAPP/fanstrade

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_NAME="fanstrade"
NAS_HOST="192.168.0.42"
NAS_USER="zerolong"
NAS_PASS="ddd123456"
NAS_PATH="/vol1/1000/AIAPP/${PROJECT_NAME}"
LOCAL_PATH=$(pwd)

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}    FansTrade NAS Deployment${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Step 1: Check prerequisites
echo -e "${YELLOW}[1/6]${NC} Checking prerequisites..."
if ! command -v rsync &> /dev/null; then
    echo -e "${RED}✗${NC} rsync not found. Please install rsync."
    exit 1
fi

if ! command -v sshpass &> /dev/null; then
    echo -e "${RED}✗${NC} sshpass not found. Please install sshpass."
    exit 1
fi

echo -e "${GREEN}✓${NC} Prerequisites check passed"
echo ""

# Step 2: Ensure NAS directory exists
echo -e "${YELLOW}[2/6]${NC} Preparing NAS directory..."
sshpass -p "${NAS_PASS}" ssh -o StrictHostKeyChecking=no ${NAS_USER}@${NAS_HOST} \
    "mkdir -p ${NAS_PATH} && mkdir -p /vol1/1000/AIAPP/data/${PROJECT_NAME}/postgres && mkdir -p /vol1/1000/AIAPP/data/${PROJECT_NAME}/redis"
echo -e "${GREEN}✓${NC} NAS directory prepared"
echo ""

# Step 3: Sync project files
echo -e "${YELLOW}[3/6]${NC} Syncing project files to NAS..."
sshpass -p "${NAS_PASS}" rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '.next' \
    --exclude 'dist' \
    --exclude '*.log' \
    --exclude '.env.local' \
    --exclude '.env.development' \
    "${LOCAL_PATH}/" \
    ${NAS_USER}@${NAS_HOST}:${NAS_PATH}/
echo -e "${GREEN}✓${NC} Files synced successfully"
echo ""

# Step 4: Stop existing containers
echo -e "${YELLOW}[4/6]${NC} Stopping existing containers..."
sshpass -p "${NAS_PASS}" ssh ${NAS_USER}@${NAS_HOST} \
    "cd ${NAS_PATH} && docker compose -f docker-compose.prod.yml down || true"
echo -e "${GREEN}✓${NC} Containers stopped"
echo ""

# Step 5: Build and start containers
echo -e "${YELLOW}[5/6]${NC} Building and starting containers..."
sshpass -p "${NAS_PASS}" ssh ${NAS_USER}@${NAS_HOST} <<EOF
cd ${NAS_PATH}
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build --remove-orphans
EOF
echo -e "${GREEN}✓${NC} Containers started"
echo ""

# Step 6: Wait and check health
echo -e "${YELLOW}[6/6]${NC} Checking container health..."
sleep 10
sshpass -p "${NAS_PASS}" ssh ${NAS_USER}@${NAS_HOST} \
    "cd ${NAS_PATH} && docker compose -f docker-compose.prod.yml ps"
echo ""

# Success message
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ Deployment completed successfully!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}🌐 Access URLs:${NC}"
echo -e "   Internal: ${GREEN}http://192.168.0.42:6677${NC}"
echo -e "   External: ${GREEN}http://nas.zerolong.top:6677${NC}"
echo ""
echo -e "${BLUE}📊 View logs:${NC}"
echo -e "   ${YELLOW}sshpass -p 'ddd123456' ssh zerolong@192.168.0.42 'docker logs -f fanstrade-backend'${NC}"
echo -e "   ${YELLOW}sshpass -p 'ddd123456' ssh zerolong@192.168.0.42 'docker logs -f fanstrade-frontend'${NC}"
echo ""
