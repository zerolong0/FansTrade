# Tradefans - Quick Start Guide

## 🎯 What We've Built

A complete **social trading platform MVP** with:

✅ User authentication (JWT)
✅ Secure API key storage (AES-256 encryption)
✅ Coinbase Pro API integration
✅ Real-time position tracking
✅ Trade history retrieval
✅ WebSocket support for real-time signals

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Setup Database

You need PostgreSQL running. Choose one:

**Option A: Use NAS PostgreSQL** (Recommended)
```bash
# Update .env with your NAS database
DATABASE_URL="postgresql://username:password@192.168.0.42:5432/tradefans?schema=public"
```

**Option B: Local PostgreSQL**
```bash
# Install PostgreSQL (Mac)
brew install postgresql
brew services start postgresql

# Create database
createdb tradefans
```

### Step 2: Run Migrations

```bash
# Generate Prisma Client
npm run db:generate

# Run migrations (creates all tables)
npm run db:migrate
```

### Step 3: Start Development Server

```bash
npm run dev
```

You should see:
```
🚀 Tradefans API v0.1.0
📊 Environment: development
🌐 Server: http://localhost:3000

✅ Database connection successful
✅ Encryption: working

✨ Ready to accept requests
```

---

## 📋 Test the API (Step by Step)

### 1. Register a User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "trader@example.com",
    "username": "cryptotrader",
    "password": "password123"
  }'
```

**Expected Response:**
```json
{
  "message": "User registered successfully",
  "user": { ... },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Copy the `token` value!** You'll need it for all subsequent requests.

---

### 2. Connect Coinbase API

First, get your Coinbase API credentials:
1. Go to https://www.coinbase.com/settings/api
2. Create new API key with "View" permissions only
3. Copy API Key and API Secret

Then connect:
```bash
curl -X POST http://localhost:3000/api/exchange/connect \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "exchange": "coinbase",
    "apiKey": "YOUR_COINBASE_API_KEY",
    "apiSecret": "YOUR_COINBASE_API_SECRET"
  }'
```

**Expected Response:**
```json
{
  "message": "Exchange API connected successfully",
  "exchange": {
    "id": "...",
    "exchange": "coinbase",
    "status": "active"
  }
}
```

---

### 3. Get Your Positions

```bash
curl -X GET http://localhost:3000/api/exchange/positions \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "exchange": "coinbase",
  "positions": [
    {
      "symbol": "BTC",
      "quantity": 0.5,
      "avgPrice": 45000,
      "currentPrice": 48000,
      "unrealizedPnl": 1500
    }
  ],
  "summary": {
    "totalValue": 24000,
    "totalPnl": 1500,
    "positionCount": 1
  }
}
```

---

## 🎉 You Did It!

You now have a working social trading platform that:
- Authenticates users securely
- Connects to Coinbase API
- Retrieves real-time positions
- Stores everything in a database

---

## 🔧 Next Steps

### Option 1: Deploy to NAS

```bash
# Build production image
docker build -t tradefans:latest .

# Deploy to NAS (use your NAS deployment script)
# or manually:
scp docker-compose.yml zerolong@192.168.0.42:/path/to/tradefans/
ssh zerolong@192.168.0.42 "cd /path/to/tradefans && docker-compose up -d"
```

### Option 2: Add More Features

Check out `README.md` for the full development roadmap:
- Social following system
- Trade signal notifications
- AI strategy analysis
- Support for more exchanges (Binance, Alpaca)

### Option 3: Build the Frontend

Create a Next.js frontend that:
- Shows trader profiles
- Displays positions in real-time
- Allows users to follow traders
- Shows trading signals feed

---

## 📚 Documentation

- **API Documentation**: See `API.md` for all endpoints
- **Database Schema**: See `prisma/schema.prisma`
- **Architecture**: See `README.md`

---

## 🐛 Troubleshooting

### "Database connection failed"
```bash
# Check PostgreSQL is running
psql -U tradefans -d tradefans -c "SELECT 1"

# Run migrations
npm run db:migrate
```

### "Encryption key must be 32 bytes"
```bash
# Regenerate keys
npx tsx scripts/generate-keys.ts

# Copy new keys to .env
```

### "Coinbase API error: 401"
- Check your API key is correct
- Ensure API key has "View" permissions
- Try creating a new API key

---

## 🎯 What's Working

✅ User registration & login
✅ JWT authentication
✅ API key encryption
✅ Coinbase API integration
✅ Position tracking
✅ Trade history
✅ WebSocket connections

---

## 🚧 What's Next (Phase 2)

⏳ Social following system
⏳ Trade signal distribution
⏳ AI strategy analysis (Claude)
⏳ Real-time notifications
⏳ Trader profiles & rankings
⏳ Support for Binance & Alpaca

---

Need help? Check `API.md` for detailed API documentation!
