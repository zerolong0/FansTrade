/**
 * Leaderboard Controller
 * 交易者排行榜
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type SortBy = 'profit' | 'winRate' | 'followers' | 'volume' | 'roi' | 'trades';

/**
 * 获取交易者排行榜
 * GET /api/leaderboard
 */
export async function getLeaderboard(req: Request, res: Response) {
  try {
    const sortBy = (req.query.sortBy as SortBy) || 'profit';
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    console.log(`[Leaderboard] Fetching top ${limit} traders, sortBy: ${sortBy}`);

    // Get all traders with their follower counts
    const traders = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        isVerified: true,
        _count: {
          select: {
            followers: true,
          },
        },
      },
    });

    // Calculate stats for each trader
    const tradersWithStats = await Promise.all(
      traders.map(async (trader) => {
        // Get trading signals stats (as a trader)
        const signals = await prisma.binanceTradingSignal.findMany({
          where: { userId: trader.id },
          select: {
            realizedPnl: true,
            realizedPnlPct: true,
            status: true,
            executedValue: true,
          },
        });

        const totalTrades = signals.length;
        const successfulTrades = signals.filter(
          (s) => s.realizedPnl && parseFloat(s.realizedPnl) > 0
        ).length;

        const totalProfit = signals.reduce((sum, s) => {
          return sum + (s.realizedPnl ? parseFloat(s.realizedPnl) : 0);
        }, 0);

        const totalVolume = signals.reduce((sum, s) => {
          return sum + (s.executedValue ? parseFloat(s.executedValue) : 0);
        }, 0);

        const winRate = totalTrades > 0 ? (successfulTrades / totalTrades) * 100 : 0;

        // ROI calculation (simplified: total profit / total volume * 100)
        const roi = totalVolume > 0 ? (totalProfit / totalVolume) * 100 : 0;

        return {
          id: trader.id,
          username: trader.username,
          displayName: trader.displayName,
          avatarUrl: trader.avatarUrl,
          isVerified: trader.isVerified,
          stats: {
            totalProfit,
            winRate,
            totalTrades,
            followersCount: trader._count.followers,
            totalVolume,
            roi,
          },
        };
      })
    );

    // Filter out traders with no activity
    const activeTraders = tradersWithStats.filter((t) => t.stats.totalTrades > 0);

    // Sort based on selected metric
    const sorted = activeTraders.sort((a, b) => {
      switch (sortBy) {
        case 'profit':
          return b.stats.totalProfit - a.stats.totalProfit;
        case 'winRate':
          return b.stats.winRate - a.stats.winRate;
        case 'followers':
          return b.stats.followersCount - a.stats.followersCount;
        case 'volume':
          return b.stats.totalVolume - a.stats.totalVolume;
        case 'roi':
          return b.stats.roi - a.stats.roi;
        case 'trades':
          return b.stats.totalTrades - a.stats.totalTrades;
        default:
          return b.stats.totalProfit - a.stats.totalProfit;
      }
    });

    // Add rank
    const rankedTraders = sorted.map((trader, index) => ({
      ...trader,
      rank: index + 1,
    }));

    // Paginate
    const paginatedTraders = rankedTraders.slice(offset, offset + limit);

    console.log(`[Leaderboard] Returning ${paginatedTraders.length} traders`);

    res.json({
      traders: paginatedTraders,
      total: rankedTraders.length,
      limit,
      offset,
      sortBy,
    });
  } catch (error: any) {
    console.error('[Leaderboard] Error:', error);
    res.status(500).json({
      error: 'Failed to fetch leaderboard',
      details: error.message,
    });
  }
}
