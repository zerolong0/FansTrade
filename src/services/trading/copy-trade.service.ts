/**
 * Copy Trade Service
 * 跟买逻辑服务（自动/手动）
 */

import { PrismaClient } from '@prisma/client';
import { Server as SocketIOServer } from 'socket.io';
import { orderExecutionService } from './order-execution.service';
import { tradeStatsService } from './trade-stats.service';

const prisma = new PrismaClient();

export interface CopyTradeConfig {
  autoExecute: boolean; // 是否自动跟买
  symbolsFilter?: string[]; // 交易对过滤（仅跟买指定交易对）
  maxAmountPerTrade?: number; // 单笔最大跟买金额（USDT）
  minConfidence?: number; // 最小信号置信度要求（0-100）
  signalTypeFilter?: string[]; // 信号类型过滤 ['STRONG_BUY', 'BUY']
}

export interface CopyTradeDecision {
  shouldCopy: boolean;
  reason: string;
  signal: any;
  followConfig: CopyTradeConfig;
  estimatedAmount?: number;
}

export interface CopyTradeRequest {
  userId: string;
  signalId: string;
  amount: number; // USDT amount to invest
  mode: 'auto' | 'manual';
}

/**
 * 跟买服务类
 */
export class CopyTradeService {
  private io: SocketIOServer | null = null;

  /**
   * 设置 Socket.IO 实例（用于推送跟买通知）
   */
  setSocketIO(io: SocketIOServer) {
    this.io = io;
    console.log('✅ Socket.IO attached to Copy Trade Service');
  }

  /**
   * 处理新信号：检查是否有用户需要跟买
   */
  async handleNewSignal(signalId: string): Promise<void> {
    try {
      // 1. 获取信号详情
      const signal = await prisma.binanceTradingSignal.findUnique({
        where: { id: signalId },
        include: {
          strategy: {
            include: {
              trader: true,
            },
          },
        },
      });

      if (!signal) {
        console.error(`❌ Signal ${signalId} not found`);
        return;
      }

      // 如果信号没有关联策略，跳过
      if (!signal.strategy) {
        console.log(`⚠️  Signal ${signalId} has no associated strategy, skipping copy trade check`);
        return;
      }

      const traderId = signal.strategy.traderId;

      // 2. 查找所有关注此交易者的用户
      const followers = await prisma.follow.findMany({
        where: {
          traderId,
        },
        include: {
          follower: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      });

      if (followers.length === 0) {
        console.log(`ℹ️  No followers for trader ${traderId}`);
        return;
      }

      console.log(`\n📡 Processing signal ${signal.symbol} ${signal.signalType}`);
      console.log(`   Checking ${followers.length} followers...`);

      // 3. 对每个关注者检查跟买条件
      for (const follow of followers) {
        const config = follow.config as CopyTradeConfig;
        const decision = this.evaluateCopyTradeDecision(signal, config);

        console.log(`   👤 ${follow.follower.username}: ${decision.shouldCopy ? '✅ COPY' : '❌ SKIP'} - ${decision.reason}`);

        if (decision.shouldCopy) {
          if (config.autoExecute) {
            // 自动跟买
            await this.executeCopyTrade({
              userId: follow.followerId,
              signalId: signal.id,
              amount: decision.estimatedAmount || 100, // 默认 100 USDT
              mode: 'auto',
            });
          } else {
            // 手动确认：推送通知
            await this.sendCopyTradeNotification(follow.followerId, signal, decision);
          }
        }
      }
    } catch (error: any) {
      console.error(`❌ Error handling new signal: ${error.message}`);
    }
  }

  /**
   * 评估跟买决策
   */
  evaluateCopyTradeDecision(
    signal: any,
    config: CopyTradeConfig
  ): CopyTradeDecision {
    const reasons: string[] = [];

    // 1. 检查交易对过滤
    if (config.symbolsFilter && config.symbolsFilter.length > 0) {
      if (!config.symbolsFilter.includes(signal.symbol)) {
        return {
          shouldCopy: false,
          reason: `Symbol ${signal.symbol} not in filter list`,
          signal,
          followConfig: config,
        };
      }
      reasons.push('Symbol matched');
    }

    // 2. 检查最小置信度
    const confidence = signal.confidence * 100; // 转换为 0-100
    if (config.minConfidence && confidence < config.minConfidence) {
      return {
        shouldCopy: false,
        reason: `Confidence ${confidence.toFixed(1)}% below minimum ${config.minConfidence}%`,
        signal,
        followConfig: config,
      };
    }
    reasons.push(`Confidence ${confidence.toFixed(1)}%`);

    // 3. 检查信号类型过滤
    if (config.signalTypeFilter && config.signalTypeFilter.length > 0) {
      if (!config.signalTypeFilter.includes(signal.signalType)) {
        return {
          shouldCopy: false,
          reason: `Signal type ${signal.signalType} not in filter list`,
          signal,
          followConfig: config,
        };
      }
      reasons.push('Signal type matched');
    }

    // 4. 检查信号状态
    if (signal.status !== 'PENDING') {
      return {
        shouldCopy: false,
        reason: `Signal status is ${signal.status}, not PENDING`,
        signal,
        followConfig: config,
      };
    }

    // 5. 计算跟买金额
    const estimatedAmount = Math.min(
      config.maxAmountPerTrade || 1000, // 默认最大 1000 USDT
      100 // 默认跟买 100 USDT（后续可根据策略调整）
    );

    return {
      shouldCopy: true,
      reason: reasons.join(', '),
      signal,
      followConfig: config,
      estimatedAmount,
    };
  }

  /**
   * 执行跟买（调用订单执行服务）
   */
  async executeCopyTrade(request: CopyTradeRequest): Promise<any> {
    const { userId, signalId, amount, mode } = request;

    console.log(`\n🔄 Executing copy trade:`);
    console.log(`   User: ${userId}`);
    console.log(`   Signal: ${signalId}`);
    console.log(`   Amount: $${amount}`);
    console.log(`   Mode: ${mode}`);

    try {
      // 获取信号详情
      const signal = await prisma.binanceTradingSignal.findUnique({
        where: { id: signalId },
      });

      if (!signal) {
        throw new Error(`Signal ${signalId} not found`);
      }

      // 获取用户的 Binance API Key
      const apiKey = await prisma.binanceApiKey.findFirst({
        where: {
          userId,
          isActive: true,
        },
      });

      if (!apiKey) {
        throw new Error(`User ${userId} has no active Binance API key`);
      }

      // 根据信号类型确定订单方向
      const side = this.getOrderSide(signal.signalType);

      if (!side) {
        console.log(`⚠️  Signal type ${signal.signalType} does not require order execution`);
        return {
          success: false,
          error: `Signal type ${signal.signalType} not actionable`,
          message: 'Signal does not require order execution',
        };
      }

      // 执行订单（带风控检查）
      const orderResult = await orderExecutionService.executeOrder({
        userId,
        symbol: signal.symbol,
        side,
        amount,
        type: 'MARKET', // 默认使用市价单
        signalId,
      });

      if (!orderResult.success) {
        console.error(`❌ Order execution failed: ${orderResult.error}`);

        // 推送失败通知
        if (this.io) {
          this.io.to(`user:${userId}`).emit('copyTrade:failed', {
            signalId,
            symbol: signal.symbol,
            error: orderResult.error,
            timestamp: Date.now(),
          });
        }

        return orderResult;
      }

      console.log(`✅ Copy trade executed successfully`);
      console.log(`   Order ID: ${orderResult.orderId}`);
      console.log(`   Executed Qty: ${orderResult.executedQty}`);
      console.log(`   Executed Price: $${orderResult.executedPrice?.toFixed(2)}`);

      // 推送成功通知
      if (this.io) {
        this.io.to(`user:${userId}`).emit('copyTrade:executed', {
          signalId,
          symbol: signal.symbol,
          signalType: signal.signalType,
          orderId: orderResult.orderId,
          executedQty: orderResult.executedQty,
          executedPrice: orderResult.executedPrice,
          amount,
          mode,
          timestamp: Date.now(),
        });
      }

      return {
        success: true,
        signalId,
        userId,
        orderId: orderResult.orderId,
        executedQty: orderResult.executedQty,
        executedPrice: orderResult.executedPrice,
        amount,
        mode,
        message: 'Copy trade executed successfully',
      };
    } catch (error: any) {
      console.error(`❌ Copy trade execution error: ${error.message}`);

      // 推送错误通知
      if (this.io) {
        this.io.to(`user:${userId}`).emit('copyTrade:error', {
          signalId,
          error: error.message,
          timestamp: Date.now(),
        });
      }

      return {
        success: false,
        error: error.message,
        message: 'Copy trade execution failed',
      };
    }
  }

  /**
   * 根据信号类型获取订单方向
   */
  private getOrderSide(signalType: string): 'BUY' | 'SELL' | null {
    switch (signalType) {
      case 'STRONG_BUY':
      case 'BUY':
        return 'BUY';
      case 'STRONG_SELL':
      case 'SELL':
        return 'SELL';
      case 'NEUTRAL':
      case 'HOLD':
      default:
        return null; // NEUTRAL 信号不执行交易
    }
  }

  /**
   * 发送跟买通知（手动确认模式）
   */
  async sendCopyTradeNotification(
    userId: string,
    signal: any,
    decision: CopyTradeDecision
  ): Promise<void> {
    console.log(`\n📧 Sending copy trade notification to user ${userId}`);

    if (this.io) {
      this.io.to(`user:${userId}`).emit('copyTrade:notification', {
        signalId: signal.id,
        symbol: signal.symbol,
        signalType: signal.signalType,
        price: parseFloat(signal.price),
        confidence: signal.confidence * 100,
        estimatedAmount: decision.estimatedAmount,
        reason: decision.reason,
        timestamp: Date.now(),
      });

      console.log(`✅ Notification sent via WebSocket`);
    } else {
      console.log(`⚠️  Socket.IO not available, notification not sent`);
    }
  }

  /**
   * 获取用户的跟买历史
   */
  async getUserCopyTradeHistory(userId: string, options: {
    page?: number;
    limit?: number;
    status?: string;
    symbol?: string;
  } = {}) {
    return tradeStatsService.getUserTradeHistory(userId, options);
  }

  /**
   * 获取跟买统计
   */
  async getCopyTradeStats(userId: string) {
    const stats = await tradeStatsService.getUserTradeStats(userId);

    return {
      totalTrades: stats.totalTrades,
      successfulTrades: stats.successfulTrades,
      failedTrades: stats.failedTrades,
      totalProfit: stats.totalProfit,
      winRate: stats.winRate,
      averageProfit: stats.avgProfit,
      totalVolume: stats.totalVolume,
      avgTradeSize: stats.avgTradeSize,
      largestWin: stats.largestWin,
      largestLoss: stats.largestLoss,
      totalCommission: stats.totalCommission,
    };
  }

  /**
   * 更新用户的跟买配置
   */
  async updateFollowConfig(
    followerId: string,
    traderId: string,
    config: Partial<CopyTradeConfig>
  ) {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_traderId: {
          followerId,
          traderId,
        },
      },
    });

    if (!follow) {
      throw new Error(`Follow relationship not found`);
    }

    const currentConfig = follow.config as CopyTradeConfig;
    const updatedConfig = {
      ...currentConfig,
      ...config,
    };

    const updated = await prisma.follow.update({
      where: {
        followerId_traderId: {
          followerId,
          traderId,
        },
      },
      data: {
        config: updatedConfig,
      },
    });

    console.log(`✅ Follow config updated for user ${followerId} following ${traderId}`);

    return updated;
  }

  /**
   * 获取用户的跟买配置
   */
  async getFollowConfig(followerId: string, traderId: string): Promise<CopyTradeConfig> {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_traderId: {
          followerId,
          traderId,
        },
      },
    });

    if (!follow) {
      throw new Error(`Follow relationship not found`);
    }

    return follow.config as CopyTradeConfig;
  }
}

// 单例导出
export const copyTradeService = new CopyTradeService();
