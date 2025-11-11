import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../config/database';
import { encrypt, decrypt } from '../utils/encryption';
import { CoinbaseService, createCoinbaseService } from '../services/coinbase.service';
import { z } from 'zod';

const router = Router();

/**
 * Validation schemas
 */
const connectExchangeSchema = z.object({
  exchange: z.enum(['coinbase', 'binance', 'alpaca']),
  apiKey: z.string().min(1, 'API key is required'),
  apiSecret: z.string().min(1, 'API secret is required'),
});

/**
 * POST /api/exchange/connect
 * Connect exchange API key
 */
router.post('/connect', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Validate input
    const validatedData = connectExchangeSchema.parse(req.body);

    // Test API connection before saving
    let connectionValid = false;

    if (validatedData.exchange === 'coinbase') {
      const coinbaseService = new CoinbaseService({
        apiKey: validatedData.apiKey,
        apiSecret: validatedData.apiSecret,
      });

      connectionValid = await coinbaseService.testConnection();
    }
    // TODO: Add tests for other exchanges (binance, alpaca)

    if (!connectionValid) {
      res.status(400).json({ error: 'Invalid API credentials or connection failed' });
      return;
    }

    // Encrypt API credentials
    const apiKeyEncrypted = encrypt(validatedData.apiKey);
    const apiSecretEncrypted = encrypt(validatedData.apiSecret);

    // Save or update API key
    const apiKeyRecord = await prisma.exchangeAPIKey.upsert({
      where: {
        userId_exchange: {
          userId: req.user.userId,
          exchange: validatedData.exchange,
        },
      },
      update: {
        apiKeyEncrypted,
        apiSecretEncrypted,
        status: 'active',
        lastSyncAt: new Date(),
      },
      create: {
        userId: req.user.userId,
        exchange: validatedData.exchange,
        apiKeyEncrypted,
        apiSecretEncrypted,
        permissions: ['read'],
        status: 'active',
        lastSyncAt: new Date(),
      },
    });

    res.json({
      message: 'Exchange API connected successfully',
      exchange: {
        id: apiKeyRecord.id,
        exchange: apiKeyRecord.exchange,
        status: apiKeyRecord.status,
        permissions: apiKeyRecord.permissions,
        lastSyncAt: apiKeyRecord.lastSyncAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }

    const message = error instanceof Error ? error.message : 'Failed to connect exchange';
    res.status(400).json({ error: message });
  }
});

/**
 * GET /api/exchange/list
 * List connected exchanges
 */
router.get('/list', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const exchanges = await prisma.exchangeAPIKey.findMany({
      where: { userId: req.user.userId },
      select: {
        id: true,
        exchange: true,
        permissions: true,
        status: true,
        lastSyncAt: true,
        createdAt: true,
      },
    });

    res.json({ exchanges });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list exchanges';
    res.status(500).json({ error: message });
  }
});

/**
 * DELETE /api/exchange/:id
 * Disconnect exchange API
 */
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { id } = req.params;

    // Check ownership
    const apiKey = await prisma.exchangeAPIKey.findFirst({
      where: {
        id,
        userId: req.user.userId,
      },
    });

    if (!apiKey) {
      res.status(404).json({ error: 'Exchange API not found' });
      return;
    }

    // Delete API key
    await prisma.exchangeAPIKey.delete({
      where: { id },
    });

    res.json({ message: 'Exchange API disconnected successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to disconnect exchange';
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/exchange/positions
 * Get current positions
 */
router.get('/positions', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Get exchange query parameter
    const exchange = req.query.exchange as string || 'coinbase';

    // Find API key
    const apiKeyRecord = await prisma.exchangeAPIKey.findFirst({
      where: {
        userId: req.user.userId,
        exchange,
        status: 'active',
      },
    });

    if (!apiKeyRecord) {
      res.status(404).json({ error: `No active ${exchange} API key found. Please connect your exchange first.` });
      return;
    }

    // Decrypt credentials and create service
    let positions: any[] = [];

    if (exchange === 'coinbase') {
      const coinbaseService = await createCoinbaseService(
        apiKeyRecord.apiKeyEncrypted,
        apiKeyRecord.apiSecretEncrypted,
        decrypt
      );

      positions = await coinbaseService.getPositions();
    }
    // TODO: Add support for other exchanges

    // Calculate total value and P&L
    const totalValue = positions.reduce((sum, pos) => sum + (pos.quantity * pos.currentPrice), 0);
    const totalPnl = positions.reduce((sum, pos) => sum + pos.unrealizedPnl, 0);

    // Save snapshot to database
    await prisma.positionSnapshot.create({
      data: {
        traderId: req.user.userId,
        exchange,
        positions: positions as any,
        totalValue,
        totalPnl,
      },
    });

    res.json({
      exchange,
      positions,
      summary: {
        totalValue,
        totalPnl,
        totalPnlPercentage: totalValue > 0 ? (totalPnl / totalValue) * 100 : 0,
        positionCount: positions.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get positions';
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/exchange/history
 * Get trade history
 */
router.get('/history', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const exchange = req.query.exchange as string || 'coinbase';
    const limit = parseInt(req.query.limit as string) || 100;

    // Find API key
    const apiKeyRecord = await prisma.exchangeAPIKey.findFirst({
      where: {
        userId: req.user.userId,
        exchange,
        status: 'active',
      },
    });

    if (!apiKeyRecord) {
      res.status(404).json({ error: `No active ${exchange} API key found` });
      return;
    }

    let trades: any[] = [];

    if (exchange === 'coinbase') {
      const coinbaseService = await createCoinbaseService(
        apiKeyRecord.apiKeyEncrypted,
        apiKeyRecord.apiSecretEncrypted,
        decrypt
      );

      trades = await coinbaseService.getTradeHistory(undefined, limit);
    }

    res.json({
      exchange,
      trades,
      count: trades.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get trade history';
    res.status(500).json({ error: message });
  }
});

export default router;
