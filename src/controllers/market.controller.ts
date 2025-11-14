/**
 * Market Data Controller
 * 提供市场数据查询接口（价格、K线、交易对信息）
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { binanceService } from '../services/binance/binance.service';

const prisma = new PrismaClient();

/**
 * 获取单个交易对的实时价格
 * GET /api/market/price/:symbol
 */
export async function getPrice(req: Request, res: Response) {
  try {
    const { symbol } = req.params;

    if (!symbol) {
      return res.status(400).json({ error: 'Symbol is required' });
    }

    const price = await binanceService.getCurrentPrice(symbol.toUpperCase());

    res.json({
      symbol: symbol.toUpperCase(),
      price,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('Get price error:', error);
    res.status(500).json({
      error: 'Failed to get price',
      details: error.message,
    });
  }
}

/**
 * 获取多个交易对的实时价格
 * GET /api/market/prices?symbols=BTCUSDT,ETHUSDT,BNBUSDT
 */
export async function getPrices(req: Request, res: Response) {
  try {
    const { symbols } = req.query;

    if (!symbols || typeof symbols !== 'string') {
      return res.status(400).json({ error: 'Symbols parameter is required (comma-separated)' });
    }

    const symbolList = symbols.split(',').map(s => s.trim().toUpperCase());

    if (symbolList.length === 0) {
      return res.status(400).json({ error: 'At least one symbol is required' });
    }

    if (symbolList.length > 20) {
      return res.status(400).json({ error: 'Maximum 20 symbols allowed' });
    }

    // 并发获取所有价格
    const pricePromises = symbolList.map(async (symbol) => {
      try {
        const price = await binanceService.getCurrentPrice(symbol);
        return { symbol, price, error: null };
      } catch (error: any) {
        return { symbol, price: null, error: error.message };
      }
    });

    const prices = await Promise.all(pricePromises);

    res.json({
      prices,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('Get prices error:', error);
    res.status(500).json({
      error: 'Failed to get prices',
      details: error.message,
    });
  }
}

/**
 * 获取 K 线数据
 * GET /api/market/klines/:symbol?interval=1h&limit=100
 */
export async function getKlines(req: Request, res: Response) {
  try {
    const { symbol } = req.params;
    const { interval = '1h', limit = '100' } = req.query;

    if (!symbol) {
      return res.status(400).json({ error: 'Symbol is required' });
    }

    const limitNum = parseInt(limit as string, 10);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 1000) {
      return res.status(400).json({ error: 'Limit must be between 1 and 1000' });
    }

    const validIntervals = ['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '8h', '12h', '1d', '3d', '1w', '1M'];
    if (!validIntervals.includes(interval as string)) {
      return res.status(400).json({
        error: 'Invalid interval',
        validIntervals,
      });
    }

    const klines = await binanceService.getKlines(
      symbol.toUpperCase(),
      interval as string,
      limitNum
    );

    res.json({
      symbol: symbol.toUpperCase(),
      interval,
      klines,
      count: klines.length,
    });
  } catch (error: any) {
    console.error('Get klines error:', error);
    res.status(500).json({
      error: 'Failed to get klines',
      details: error.message,
    });
  }
}

/**
 * 获取所有支持的交易对列表
 * GET /api/market/pairs?isActive=true&page=1&limit=50
 */
export async function getTradingPairs(req: Request, res: Response) {
  try {
    const { isActive, page = '1', limit = '50', search } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({ error: 'Invalid page number' });
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({ error: 'Limit must be between 1 and 100' });
    }

    const where: any = {};

    // 过滤激活状态
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    // 搜索过滤
    if (search && typeof search === 'string') {
      where.OR = [
        { symbol: { contains: search.toUpperCase() } },
        { baseAsset: { contains: search.toUpperCase() } },
      ];
    }

    // 获取总数
    const total = await prisma.tradingPair.count({ where });

    // 获取分页数据
    const pairs = await prisma.tradingPair.findMany({
      where,
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      orderBy: { symbol: 'asc' },
      select: {
        id: true,
        symbol: true,
        baseAsset: true,
        quoteAsset: true,
        status: true,
        isActive: true,
        minPrice: true,
        maxPrice: true,
        tickSize: true,
        minQty: true,
        maxQty: true,
        stepSize: true,
        minNotional: true,
        lastSyncAt: true,
      },
    });

    res.json({
      pairs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error('Get trading pairs error:', error);
    res.status(500).json({
      error: 'Failed to get trading pairs',
      details: error.message,
    });
  }
}

/**
 * 获取单个交易对详情
 * GET /api/market/pairs/:symbol
 */
export async function getTradingPair(req: Request, res: Response) {
  try {
    const { symbol } = req.params;

    if (!symbol) {
      return res.status(400).json({ error: 'Symbol is required' });
    }

    const pair = await prisma.tradingPair.findUnique({
      where: { symbol: symbol.toUpperCase() },
    });

    if (!pair) {
      return res.status(404).json({ error: 'Trading pair not found' });
    }

    res.json({ pair });
  } catch (error: any) {
    console.error('Get trading pair error:', error);
    res.status(500).json({
      error: 'Failed to get trading pair',
      details: error.message,
    });
  }
}

/**
 * 同步交易对信息（管理员功能）
 * POST /api/market/sync-pairs
 */
export async function syncTradingPairs(req: Request, res: Response) {
  try {
    // TODO: 添加管理员权限验证
    // const isAdmin = req.user?.role === 'admin';
    // if (!isAdmin) {
    //   return res.status(403).json({ error: 'Admin access required' });
    // }

    console.log('🔄 Starting trading pairs sync...');
    const syncCount = await binanceService.syncTradingPairs();

    res.json({
      message: 'Trading pairs synchronized successfully',
      syncCount,
      timestamp: new Date(),
    });
  } catch (error: any) {
    console.error('Sync trading pairs error:', error);
    res.status(500).json({
      error: 'Failed to sync trading pairs',
      details: error.message,
    });
  }
}

/**
 * 获取交易对统计信息
 * GET /api/market/stats
 */
export async function getMarketStats(req: Request, res: Response) {
  try {
    const totalPairs = await prisma.tradingPair.count();
    const activePairs = await prisma.tradingPair.count({
      where: { isActive: true },
    });

    const lastSync = await prisma.tradingPair.findFirst({
      orderBy: { lastSyncAt: 'desc' },
      select: { lastSyncAt: true },
    });

    res.json({
      stats: {
        totalPairs,
        activePairs,
        inactivePairs: totalPairs - activePairs,
        lastSyncAt: lastSync?.lastSyncAt || null,
      },
    });
  } catch (error: any) {
    console.error('Get market stats error:', error);
    res.status(500).json({
      error: 'Failed to get market stats',
      details: error.message,
    });
  }
}
