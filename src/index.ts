import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { testDatabaseConnection } from './config/database';
import { testEncryption } from './utils/encryption';

// Import routes
import authRoutes from './routes/auth.routes';
import exchangeRoutes from './routes/exchange.routes';
import followRoutes from './routes/follow.routes';
import tradersRoutes from './routes/traders.routes';
import binanceApiKeyRoutes from './routes/binance-api-key.routes';
import marketRoutes from './routes/market.routes';

// Import services
import { signalScannerService } from './services/scheduler/signal-scanner.service';
import { copyTradeService } from './services/trading/copy-trade.service';

// Load environment variables (override system env vars)
dotenv.config({ override: true });

const app = express();
const httpServer = createServer(app);

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:3000',
  'http://localhost:3001', // 添加前端开发端口
  'http://192.168.0.42:3001', // NAS 内网访问
];

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', async (_req, res) => {
  const dbConnected = await testDatabaseConnection();
  const encryptionWorks = testEncryption();

  res.json({
    status: dbConnected && encryptionWorks ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    service: 'fanstrade-api',
    version: '0.1.0',
    checks: {
      database: dbConnected ? 'ok' : 'failed',
      encryption: encryptionWorks ? 'ok' : 'failed',
    },
  });
});

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    message: 'FansTrade API',
    version: '0.1.0',
    endpoints: {
      auth: '/api/auth',
      exchange: '/api/exchange',
      follow: '/api/follow',
      binanceApiKeys: '/api/binance/api-keys',
      market: '/api/market',
      health: '/health',
    },
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/exchange', exchangeRoutes);
app.use('/api/follow', followRoutes);
app.use('/api/binance/api-keys', binanceApiKeyRoutes);
app.use('/api/market', marketRoutes);
app.use('/api', tradersRoutes);

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);

  // Subscribe to trader's signals
  socket.on('subscribe', (traderId: string) => {
    socket.join(`trader:${traderId}`);
    console.log(`📡 Socket ${socket.id} subscribed to trader ${traderId}`);
  });

  // Unsubscribe from trader's signals
  socket.on('unsubscribe', (traderId: string) => {
    socket.leave(`trader:${traderId}`);
    console.log(`📡 Socket ${socket.id} unsubscribed from trader ${traderId}`);
  });

  // Subscribe to all trading signals
  socket.on('subscribe:signals', () => {
    socket.join('signals:all');
    console.log(`📡 Socket ${socket.id} subscribed to all signals`);
  });

  // Subscribe to specific symbol signals
  socket.on('subscribe:symbol', (symbol: string) => {
    socket.join(`signal:${symbol}`);
    console.log(`📡 Socket ${socket.id} subscribed to ${symbol} signals`);
  });

  // Unsubscribe from signal channels
  socket.on('unsubscribe:signals', () => {
    socket.leave('signals:all');
    console.log(`📡 Socket ${socket.id} unsubscribed from all signals`);
  });

  socket.on('unsubscribe:symbol', (symbol: string) => {
    socket.leave(`signal:${symbol}`);
    console.log(`📡 Socket ${socket.id} unsubscribed from ${symbol} signals`);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
  });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('❌ Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server only if not in test mode
const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'test') {
  httpServer.listen(PORT, async () => {
    console.log(`\n🚀 FansTrade API v0.1.0`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 Server: http://localhost:${PORT}`);
    console.log(`\n📡 API Endpoints:`);
    console.log(`   - Health: http://localhost:${PORT}/health`);
    console.log(`   - Auth: http://localhost:${PORT}/api/auth`);
    console.log(`   - Exchange: http://localhost:${PORT}/api/exchange`);
    console.log(`   - Follow: http://localhost:${PORT}/api/follow`);
    console.log(`   - Binance API Keys: http://localhost:${PORT}/api/binance/api-keys`);
    console.log(`   - Market Data: http://localhost:${PORT}/api/market`);

    // Test connections
    console.log(`\n🔍 Running system checks...`);
    await testDatabaseConnection();
    const encryptionOk = testEncryption();
    console.log(`${encryptionOk ? '✅' : '❌'} Encryption: ${encryptionOk ? 'working' : 'failed'}`);

    // Initialize Signal Scanner
    console.log(`\n📡 Initializing Signal Scanner...`);
    signalScannerService.setSocketIO(io);
    copyTradeService.setSocketIO(io);

    // Optional: Auto-start scanner (controlled by environment variable)
    if (process.env.AUTO_START_SCANNER === 'true') {
      signalScannerService.startDefaultScanner();
      console.log(`✅ Signal Scanner auto-started`);
    } else {
      console.log(`⚠️  Signal Scanner not auto-started (set AUTO_START_SCANNER=true to enable)`);
    }

    console.log(`\n✨ Ready to accept requests\n`);
  });
}

export { app, io };
