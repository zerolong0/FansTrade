/**
 * Trading Signal Generator Service
 * 交易信号生成和管理服务
 */

import { PrismaClient } from '@prisma/client';
import {
  technicalIndicatorsService,
  SignalAnalysis,
} from '../indicators/technical-indicators.service';
import { binanceService } from '../binance/binance.service';

const prisma = new PrismaClient();

export interface SignalGenerationOptions {
  symbol: string;
  interval?: string;
  limit?: number;
  strategyId?: string | null;
}

export interface SignalQueryOptions {
  symbol?: string;
  signalType?: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';
  status?: 'PENDING' | 'EXECUTED' | 'EXPIRED' | 'CANCELLED';
  strategyId?: string;
  fromDate?: Date;
  toDate?: Date;
  page?: number;
  limit?: number;
}

export interface SignalGenerationResult {
  signal: any;
  analysis: SignalAnalysis;
}

/**
 * 信号生成服务类
 */
export class SignalGeneratorService {
  /**
   * 为单个交易对生成信号
   */
  async generateSignal(options: SignalGenerationOptions): Promise<SignalGenerationResult> {
    const { symbol, interval = '1h', limit = 100, strategyId = null } = options;

    // 1. 确保交易对存在于数据库
    let tradingPair = await prisma.tradingPair.findUnique({
      where: { symbol },
    });

    if (!tradingPair) {
      // 如果不存在，尝试同步
      await binanceService.syncTradingPairs();
      tradingPair = await prisma.tradingPair.findUnique({
        where: { symbol },
      });

      if (!tradingPair) {
        throw new Error(`Trading pair ${symbol} not found`);
      }
    }

    // 2. 生成技术分析
    const analysis = await technicalIndicatorsService.analyzeSignal(symbol, interval, limit);

    // 3. 转换信号类型为大写（匹配数据库枚举）
    const signalType = analysis.signal.toUpperCase().replace('_', '_'); // STRONG_BUY, BUY, etc.

    // 4. 构建指标快照
    const indicators = {
      macd: {
        value: analysis.indicators.macd.value,
        signal: analysis.indicators.macd.signal,
        histogram: analysis.indicators.macd.histogram,
        trend: analysis.indicators.macd.trend,
        crossover: analysis.indicators.macd.crossover,
      },
      rsi: {
        value: analysis.indicators.rsi.value,
        condition: analysis.indicators.rsi.condition,
      },
      bollingerBands: {
        upper: analysis.indicators.bollingerBands.upper,
        middle: analysis.indicators.bollingerBands.middle,
        lower: analysis.indicators.bollingerBands.lower,
        position: analysis.indicators.bollingerBands.position,
        bandwidth: analysis.indicators.bollingerBands.bandwidth,
        squeeze: analysis.indicators.bollingerBands.squeeze,
      },
      reasons: analysis.reasons,
    };

    // 5. 保存信号到数据库
    const signal = await prisma.binanceTradingSignal.create({
      data: {
        symbol,
        signalType,
        price: analysis.currentPrice.toString(),
        confidence: analysis.confidence / 100, // 转换为 0-1
        indicators,
        status: 'PENDING',
        tradingPairId: tradingPair.id,
        strategyId,
      },
    });

    return {
      signal,
      analysis,
    };
  }

  /**
   * 批量生成信号（为多个交易对）
   */
  async generateSignalsForMultipleSymbols(
    symbols: string[],
    interval: string = '1h',
    limit: number = 100,
    strategyId: string | null = null
  ): Promise<SignalGenerationResult[]> {
    const results: SignalGenerationResult[] = [];

    for (const symbol of symbols) {
      try {
        const result = await this.generateSignal({
          symbol,
          interval,
          limit,
          strategyId,
        });
        results.push(result);
      } catch (error: any) {
        console.error(`❌ Failed to generate signal for ${symbol}:`, error.message);
      }
    }

    return results;
  }

  /**
   * 查询历史信号
   */
  async querySignals(options: SignalQueryOptions = {}) {
    const {
      symbol,
      signalType,
      status,
      strategyId,
      fromDate,
      toDate,
      page = 1,
      limit = 50,
    } = options;

    // 构建查询条件
    const where: any = {};

    if (symbol) where.symbol = symbol;
    if (signalType) where.signalType = signalType;
    if (status) where.status = status;
    if (strategyId) where.strategyId = strategyId;

    // 时间范围过滤
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = fromDate;
      if (toDate) where.createdAt.lte = toDate;
    }

    // 分页查询
    const [total, signals] = await Promise.all([
      prisma.binanceTradingSignal.count({ where }),
      prisma.binanceTradingSignal.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          tradingPair: {
            select: {
              symbol: true,
              baseAsset: true,
              quoteAsset: true,
            },
          },
          strategy: {
            select: {
              id: true,
              tradingStyle: true,
              description: true,
            },
          },
        },
      }),
    ]);

    return {
      signals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 获取单个信号详情
   */
  async getSignalById(signalId: string) {
    const signal = await prisma.binanceTradingSignal.findUnique({
      where: { id: signalId },
      include: {
        tradingPair: true,
        strategy: true,
      },
    });

    if (!signal) {
      throw new Error(`Signal ${signalId} not found`);
    }

    return signal;
  }

  /**
   * 更新信号状态
   */
  async updateSignalStatus(
    signalId: string,
    status: 'PENDING' | 'EXECUTED' | 'EXPIRED' | 'CANCELLED',
    executedPrice?: number
  ) {
    const updateData: any = {
      status,
    };

    if (status === 'EXECUTED') {
      updateData.executedAt = new Date();
      if (executedPrice) {
        updateData.executedPrice = executedPrice.toString();
      }
    }

    const signal = await prisma.binanceTradingSignal.update({
      where: { id: signalId },
      data: updateData,
    });

    return signal;
  }

  /**
   * 获取信号统计
   */
  async getSignalStatistics(options: {
    symbol?: string;
    strategyId?: string;
    fromDate?: Date;
    toDate?: Date;
  }) {
    const where: any = {};
    if (options.symbol) where.symbol = options.symbol;
    if (options.strategyId) where.strategyId = options.strategyId;

    if (options.fromDate || options.toDate) {
      where.createdAt = {};
      if (options.fromDate) where.createdAt.gte = options.fromDate;
      if (options.toDate) where.createdAt.lte = options.toDate;
    }

    // 统计各类信号数量
    const [
      totalSignals,
      strongBuyCount,
      buyCount,
      neutralCount,
      sellCount,
      strongSellCount,
      pendingCount,
      executedCount,
      expiredCount,
      cancelledCount,
    ] = await Promise.all([
      prisma.binanceTradingSignal.count({ where }),
      prisma.binanceTradingSignal.count({ where: { ...where, signalType: 'STRONG_BUY' } }),
      prisma.binanceTradingSignal.count({ where: { ...where, signalType: 'BUY' } }),
      prisma.binanceTradingSignal.count({ where: { ...where, signalType: 'NEUTRAL' } }),
      prisma.binanceTradingSignal.count({ where: { ...where, signalType: 'SELL' } }),
      prisma.binanceTradingSignal.count({ where: { ...where, signalType: 'STRONG_SELL' } }),
      prisma.binanceTradingSignal.count({ where: { ...where, status: 'PENDING' } }),
      prisma.binanceTradingSignal.count({ where: { ...where, status: 'EXECUTED' } }),
      prisma.binanceTradingSignal.count({ where: { ...where, status: 'EXPIRED' } }),
      prisma.binanceTradingSignal.count({ where: { ...where, status: 'CANCELLED' } }),
    ]);

    // 平均置信度
    const avgConfidence = await prisma.binanceTradingSignal.aggregate({
      where,
      _avg: {
        confidence: true,
      },
    });

    return {
      total: totalSignals,
      bySignalType: {
        strongBuy: strongBuyCount,
        buy: buyCount,
        neutral: neutralCount,
        sell: sellCount,
        strongSell: strongSellCount,
      },
      byStatus: {
        pending: pendingCount,
        executed: executedCount,
        expired: expiredCount,
        cancelled: cancelledCount,
      },
      avgConfidence: avgConfidence._avg.confidence || 0,
    };
  }

  /**
   * 清理过期信号（超过 24 小时的 PENDING 信号）
   */
  async cleanupExpiredSignals(): Promise<number> {
    const expirationTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24小时前

    const result = await prisma.binanceTradingSignal.updateMany({
      where: {
        status: 'PENDING',
        createdAt: {
          lt: expirationTime,
        },
      },
      data: {
        status: 'EXPIRED',
      },
    });

    return result.count;
  }
}

// 单例导出
export const signalGeneratorService = new SignalGeneratorService();
