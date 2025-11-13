import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/traders
 * 获取所有交易员列表
 */
router.get('/traders', async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const traders = await prisma.user.findMany({
      take: Number(limit),
      skip: Number(offset),
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        isVerified: true,
        _count: {
          select: {
            followers: true,
          },
        },
      },
      orderBy: {
        followers: {
          _count: 'desc',
        },
      },
    });

    const total = await prisma.user.count();

    res.json({
      traders,
      total,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error: any) {
    console.error('Get traders error:', error);
    res.status(500).json({ error: 'Failed to fetch traders' });
  }
});

/**
 * GET /api/traders/:id
 * 获取交易员详情
 */
router.get('/traders/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const trader = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        twitterHandle: true,
        isVerified: true,
        createdAt: true,
        _count: {
          select: {
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!trader) {
      return res.status(404).json({ error: 'Trader not found' });
    }

    // 获取交易策略
    const strategy = await prisma.tradingStrategy.findUnique({
      where: { traderId: id },
    });

    res.json({
      trader,
      strategy,
    });
  } catch (error: any) {
    console.error('Get trader detail error:', error);
    res.status(500).json({ error: 'Failed to fetch trader' });
  }
});

export default router;
