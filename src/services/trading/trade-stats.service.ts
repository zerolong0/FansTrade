/**
 * Trade Statistics Service
 * 交易统计和盈亏计算服务
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface TradeStats {
  totalTrades: number;
  successfulTrades: number;
  failedTrades: number;
  winRate: number;
  totalVolume: number; // 总交易金额 (USDT)
  avgTradeSize: number; // 平均交易金额
  totalProfit: number; // 总盈亏 (USDT) - 仅计算已平仓的
  avgProfit: number; // 平均每笔盈亏
  largestWin: number;
  largestLoss: number;
  totalCommission: number;
}

export interface DailyTradeVolume {
  date: string;
  volume: number;
  trades: number;
}

/**
 * 交易统计服务类
 */
export class TradeStatsService {
  /**
   * 获取用户的总体交易统计
   */
  async getUserTradeStats(userId: string): Promise<TradeStats> {
    // 获取所有交易记录
    const trades = await prisma.copyTradeRecord.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const totalTrades = trades.length;
    const successfulTrades = trades.filter((t) => t.status === 'FILLED').length;
    const failedTrades = trades.filter((t) => t.status === 'FAILED').length;

    // 计算总交易量
    const totalVolume = trades
      .filter((t) => t.status === 'FILLED')
      .reduce((sum, trade) => sum + parseFloat(trade.executedValue), 0);

    const avgTradeSize = successfulTrades > 0 ? totalVolume / successfulTrades : 0;

    // 计算已实现盈亏（仅计算已平仓的订单）
    const closedTrades = trades.filter((t) => t.closedAt && t.realizedPnl);
    const totalProfit = closedTrades.reduce((sum, trade) => {
      return sum + parseFloat(trade.realizedPnl || '0');
    }, 0);

    const avgProfit = closedTrades.length > 0 ? totalProfit / closedTrades.length : 0;

    // 找出最大盈利和亏损
    const profits = closedTrades.map((t) => parseFloat(t.realizedPnl || '0'));
    const largestWin = profits.length > 0 ? Math.max(...profits) : 0;
    const largestLoss = profits.length > 0 ? Math.min(...profits) : 0;

    // 计算总手续费
    const totalCommission = trades.reduce((sum, trade) => {
      return sum + parseFloat(trade.commission);
    }, 0);

    // 计算胜率（基于已平仓订单）
    const winningTrades = closedTrades.filter((t) => parseFloat(t.realizedPnl || '0') > 0).length;
    const winRate = closedTrades.length > 0 ? (winningTrades / closedTrades.length) * 100 : 0;

    return {
      totalTrades,
      successfulTrades,
      failedTrades,
      winRate,
      totalVolume,
      avgTradeSize,
      totalProfit,
      avgProfit,
      largestWin,
      largestLoss,
      totalCommission,
    };
  }

  /**
   * 获取用户的每日交易量统计
   */
  async getUserDailyVolume(
    userId: string,
    days: number = 30
  ): Promise<DailyTradeVolume[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const trades = await prisma.copyTradeRecord.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
        },
        status: 'FILLED',
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // 按日期分组
    const dailyMap = new Map<string, { volume: number; trades: number }>();

    trades.forEach((trade) => {
      const date = trade.createdAt.toISOString().split('T')[0];
      const volume = parseFloat(trade.executedValue);

      if (dailyMap.has(date)) {
        const existing = dailyMap.get(date)!;
        existing.volume += volume;
        existing.trades += 1;
      } else {
        dailyMap.set(date, { volume, trades: 1 });
      }
    });

    // 转换为数组
    return Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      volume: data.volume,
      trades: data.trades,
    }));
  }

  /**
   * 获取用户的交易历史
   */
  async getUserTradeHistory(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      status?: string;
      symbol?: string;
    } = {}
  ) {
    const { page = 1, limit = 50, status, symbol } = options;

    const where: any = { userId };
    if (status) where.status = status;
    if (symbol) where.symbol = symbol;

    const [trades, total] = await Promise.all([
      prisma.copyTradeRecord.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.copyTradeRecord.count({ where }),
    ]);

    return {
      trades,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 获取今日交易统计（用于风控的每日限额检查）
   */
  async getTodayTradeVolume(userId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const trades = await prisma.copyTradeRecord.findMany({
      where: {
        userId,
        createdAt: {
          gte: today,
        },
        status: 'FILLED',
      },
    });

    return trades.reduce((sum, trade) => sum + parseFloat(trade.executedValue), 0);
  }

  /**
   * 获取用户跟随特定交易者的统计
   */
  async getTraderFollowStats(userId: string, traderId: string): Promise<TradeStats> {
    const trades = await prisma.copyTradeRecord.findMany({
      where: {
        userId,
        traderId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const totalTrades = trades.length;
    const successfulTrades = trades.filter((t) => t.status === 'FILLED').length;
    const failedTrades = trades.filter((t) => t.status === 'FAILED').length;

    const totalVolume = trades
      .filter((t) => t.status === 'FILLED')
      .reduce((sum, trade) => sum + parseFloat(trade.executedValue), 0);

    const avgTradeSize = successfulTrades > 0 ? totalVolume / successfulTrades : 0;

    const closedTrades = trades.filter((t) => t.closedAt && t.realizedPnl);
    const totalProfit = closedTrades.reduce((sum, trade) => {
      return sum + parseFloat(trade.realizedPnl || '0');
    }, 0);

    const avgProfit = closedTrades.length > 0 ? totalProfit / closedTrades.length : 0;

    const profits = closedTrades.map((t) => parseFloat(t.realizedPnl || '0'));
    const largestWin = profits.length > 0 ? Math.max(...profits) : 0;
    const largestLoss = profits.length > 0 ? Math.min(...profits) : 0;

    const totalCommission = trades.reduce((sum, trade) => {
      return sum + parseFloat(trade.commission);
    }, 0);

    const winningTrades = closedTrades.filter((t) => parseFloat(t.realizedPnl || '0') > 0).length;
    const winRate = closedTrades.length > 0 ? (winningTrades / closedTrades.length) * 100 : 0;

    return {
      totalTrades,
      successfulTrades,
      failedTrades,
      winRate,
      totalVolume,
      avgTradeSize,
      totalProfit,
      avgProfit,
      largestWin,
      largestLoss,
      totalCommission,
    };
  }

  /**
   * 更新交易记录的平仓信息（平仓价格、盈亏）
   */
  async updateTradeClose(
    recordId: string,
    closePrice: number,
    realizedPnl: number
  ): Promise<void> {
    const record = await prisma.copyTradeRecord.findUnique({
      where: { id: recordId },
    });

    if (!record) {
      throw new Error(`Trade record ${recordId} not found`);
    }

    const openPrice = parseFloat(record.executedPrice);
    const quantity = parseFloat(record.executedQty);
    const pnlPct = ((closePrice - openPrice) / openPrice) * 100;

    await prisma.copyTradeRecord.update({
      where: { id: recordId },
      data: {
        closePrice: closePrice.toString(),
        closedAt: new Date(),
        realizedPnl: realizedPnl.toString(),
        realizedPnlPct: pnlPct,
      },
    });

    console.log(`✅ Trade ${recordId} closed: P&L = ${realizedPnl.toFixed(2)} USDT (${pnlPct.toFixed(2)}%)`);
  }
}

// 单例导出
export const tradeStatsService = new TradeStatsService();
