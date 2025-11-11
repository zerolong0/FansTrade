# FansTrade

Social trading platform with AI-powered strategy analysis. Follow top crypto traders and replicate their strategies automatically.

## Features (MVP)

- 🔐 Exchange API integration (Coinbase Pro)
- 📊 Real-time position tracking
- 🤖 AI-powered trading strategy analysis
- 👥 Social following system
- 📡 Real-time trade signal notifications
- 🔒 Secure API key encryption (AES-256)

## Tech Stack

- **Backend**: Node.js + TypeScript + Express
- **Database**: PostgreSQL + Prisma ORM
- **Cache**: Redis
- **WebSocket**: Socket.io
- **AI**: Claude (Anthropic)
- **Deployment**: Docker + Docker Compose

## Quick Start

### Prerequisites

- Node.js >= 20
- Docker & Docker Compose
- PostgreSQL 16+
- Redis 7+

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment

```bash
cp .env.example .env
# Edit .env with your configurations
```

### 3. Start Services (Docker)

```bash
# Start PostgreSQL + Redis
docker-compose up -d postgres redis

# Run database migrations
npm run db:migrate

# Generate Prisma Client
npm run db:generate
```

### 4. Development

```bash
# Start development server (with hot reload)
npm run dev

# Access API: http://localhost:3000
# Health check: http://localhost:3000/health
```

### 5. Docker Full Stack

```bash
# Start all services (API + DB + Redis)
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop all services
docker-compose down
```

## Project Structure

```
fanstrade/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── index.ts               # App entry point
│   ├── config/                # Configuration
│   ├── models/                # Data models
│   ├── services/              # Business logic
│   │   ├── auth.service.ts
│   │   ├── exchange.service.ts
│   │   └── ai.service.ts
│   ├── routes/                # API routes
│   ├── middleware/            # Express middleware
│   └── utils/                 # Utility functions
│       └── encryption.ts      # API key encryption
├── docker-compose.yml         # Docker orchestration
├── Dockerfile                 # Docker build config
├── package.json
└── tsconfig.json
```

## API Endpoints (Planned)

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout

### Exchange Integration
- `POST /api/exchange/connect` - Connect exchange API key
- `GET /api/exchange/positions` - Get current positions
- `GET /api/exchange/history` - Get trade history

### Social
- `POST /api/follow/:userId` - Follow a trader
- `DELETE /api/follow/:userId` - Unfollow
- `GET /api/followers` - Get followers list
- `GET /api/feed` - Get trading signals feed

### Trading Signals
- `GET /api/signals` - Get recent signals
- `POST /api/signals/:id/execute` - Execute a signal

### AI Analysis
- `GET /api/strategy/:userId` - Get AI-generated strategy profile
- `POST /api/strategy/analyze` - Trigger strategy analysis

## WebSocket Events

### Client → Server
- `subscribe` - Subscribe to trader's signals
- `unsubscribe` - Unsubscribe from trader

### Server → Client
- `trade_signal` - New trade signal from followed trader
- `position_update` - Position changed
- `price_update` - Real-time price update

## Security

- ✅ API keys encrypted with AES-256
- ✅ JWT authentication
- ✅ Rate limiting
- ✅ CORS protection
- ✅ Helmet.js security headers
- ✅ SQL injection prevention (Prisma)

## Development Roadmap

### Phase 1: MVP (Current)
- [x] Project setup
- [ ] Coinbase Pro API integration
- [ ] Position tracking
- [ ] User authentication
- [ ] Basic following system

### Phase 2: Social Features
- [ ] Trading signals feed
- [ ] AI strategy analysis
- [ ] Real-time notifications
- [ ] Trader profiles

### Phase 3: Advanced
- [ ] Multiple exchanges (Binance, Alpaca)
- [ ] Paid subscriptions
- [ ] Advanced analytics
- [ ] Mobile app

## Environment Variables

See `.env.example` for all required environment variables.

Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Secret for JWT signing
- `ENCRYPTION_KEY` - 32-byte key for API key encryption
- `ANTHROPIC_API_KEY` - Claude API key
- `COINBASE_API_URL` - Coinbase API endpoint

## License

MIT

## Author

zerolong
