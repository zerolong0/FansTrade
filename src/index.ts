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

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', async (req, res) => {
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
app.get('/', (req, res) => {
  res.json({
    message: 'FansTrade API',
    version: '0.1.0',
    endpoints: {
      auth: '/api/auth',
      exchange: '/api/exchange',
      health: '/health',
    },
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/exchange', exchangeRoutes);

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
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, async () => {
  console.log(`\n🚀 FansTrade API v0.1.0`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Server: http://localhost:${PORT}`);
  console.log(`\n📡 API Endpoints:`);
  console.log(`   - Health: http://localhost:${PORT}/health`);
  console.log(`   - Auth: http://localhost:${PORT}/api/auth`);
  console.log(`   - Exchange: http://localhost:${PORT}/api/exchange`);

  // Test connections
  console.log(`\n🔍 Running system checks...`);
  await testDatabaseConnection();
  const encryptionOk = testEncryption();
  console.log(`${encryptionOk ? '✅' : '❌'} Encryption: ${encryptionOk ? 'working' : 'failed'}`);
  console.log(`\n✨ Ready to accept requests\n`);
});

export { app, io };
