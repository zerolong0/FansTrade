/**
 * Order Execution Service
 * 订单执行服务（下单、风控、状态跟踪）
 */

import { PrismaClient } from '@prisma/client';
import { binanceService } from '../binance/binance.service';
import { decrypt } from '../../utils/encryption';
import { tradeStatsService } from './trade-stats.service';

const prisma = new PrismaClient();

export interface OrderRequest {
  userId: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  amount: number; // USDT amount
  type?: 'MARKET' | 'LIMIT';
  price?: number; // For limit orders
  signalId?: string; // Associated signal
}

export interface RiskCheckResult {
  passed: boolean;
  reason?: string;
  checks: {
    balance: { passed: boolean; available: number; required: number };
    positionSize: { passed: boolean; current: number; max: number };
    dailyLimit: { passed: boolean; used: number; limit: number };
  };
}

export interface OrderResult {
  success: boolean;
  orderId?: string;
  executedQty?: number;
  executedPrice?: number;
  status?: string;
  message?: string;
  error?: string;
}

/**
 * 订单执行服务类
 */
export class OrderExecutionService {
  /**
   * 执行订单（带风控检查）
   */
  async executeOrder(request: OrderRequest): Promise<OrderResult> {
    const { userId, symbol, side, amount, type = 'MARKET', price, signalId } = request;

    console.log(`\n📋 Order Request:`);
    console.log(`   User: ${userId}`);
    console.log(`   Symbol: ${symbol}`);
    console.log(`   Side: ${side}`);
    console.log(`   Amount: $${amount}`);
    console.log(`   Type: ${type}`);
    if (price) console.log(`   Price: $${price}`);
    if (signalId) console.log(`   Signal: ${signalId}`);

    try {
      // 1. 风控检查
      const riskCheck = await this.performRiskChecks(userId, symbol, amount);

      if (!riskCheck.passed) {
        console.log(`❌ Risk check failed: ${riskCheck.reason}`);
        return {
          success: false,
          error: riskCheck.reason,
          message: 'Risk check failed',
        };
      }

      console.log(`✅ Risk checks passed`);

      // 2. 获取用户的 Binance API Key
      const apiKey = await prisma.binanceApiKey.findFirst({
        where: {
          userId,
          isActive: true,
        },
      });

      if (!apiKey) {
        return {
          success: false,
          error: 'No active Binance API key found',
          message: 'Please add Binance API key first',
        };
      }

      // 3. 解密 API Key
      const decryptedKey = decrypt(apiKey.apiKeyEncrypted);
      const decryptedSecret = decrypt(apiKey.apiSecretEncrypted);

      // 4. 获取当前市场价（用于计算数量）
      const currentPrice = await this.getCurrentPrice(symbol);
      console.log(`   Current Price: $${currentPrice.toFixed(2)}`);

      // 5. 计算购买数量
      const quantity = this.calculateQuantity(amount, currentPrice, symbol);
      console.log(`   Order Quantity: ${quantity}`);

      // 6. 执行下单
      const orderResult = await this.placeOrder({
        apiKey: decryptedKey,
        apiSecret: decryptedSecret,
        symbol,
        side,
        quantity,
        type,
        price,
      });

      console.log(`✅ Order executed successfully`);
      console.log(`   Order ID: ${orderResult.orderId}`);
      console.log(`   Executed Qty: ${orderResult.executedQty}`);
      console.log(`   Executed Price: $${orderResult.executedPrice?.toFixed(2)}`);

      // 7. 记录订单到数据库
      await this.logOrder(userId, signalId, orderResult, request);

      return {
        success: true,
        ...orderResult,
        message: 'Order executed successfully',
      };
    } catch (error: any) {
      console.error(`❌ Order execution failed: ${error.message}`);

      // 记录失败的订单
      await this.logOrder(
        userId,
        signalId,
        {
          success: false,
          error: error.message,
          message: 'Order execution failed',
        },
        request
      );

      return {
        success: false,
        error: error.message,
        message: 'Order execution failed',
      };
    }
  }

  /**
   * 风控检查
   */
  async performRiskChecks(userId: string, symbol: string, amount: number): Promise<RiskCheckResult> {
    console.log(`\n🔍 Performing risk checks...`);

    const checks: RiskCheckResult['checks'] = {
      balance: { passed: false, available: 0, required: amount },
      positionSize: { passed: false, current: 0, max: 10000 },
      dailyLimit: { passed: false, used: 0, limit: 5000 },
    };

    try {
      // 1. 检查账户余额（USDT）
      const apiKey = await prisma.binanceApiKey.findFirst({
        where: { userId, isActive: true },
      });

      if (!apiKey) {
        return {
          passed: false,
          reason: 'No active API key',
          checks,
        };
      }

      const decryptedKey = decrypt(apiKey.apiKeyEncrypted);
      const decryptedSecret = decrypt(apiKey.apiSecretEncrypted);

      const balance = await binanceService.getAssetBalance(decryptedKey, decryptedSecret, 'USDT');
      checks.balance.available = parseFloat(balance.free);
      checks.balance.passed = checks.balance.available >= amount;

      console.log(`   💰 Balance: $${checks.balance.available.toFixed(2)} (Required: $${amount})`);

      if (!checks.balance.passed) {
        return {
          passed: false,
          reason: `Insufficient balance. Available: $${checks.balance.available.toFixed(2)}, Required: $${amount}`,
          checks,
        };
      }

      // 2. 检查单笔订单最大金额（默认 $10,000）
      checks.positionSize.current = amount;
      checks.positionSize.passed = amount <= checks.positionSize.max;

      console.log(`   📊 Position Size: $${amount} (Max: $${checks.positionSize.max})`);

      if (!checks.positionSize.passed) {
        return {
          passed: false,
          reason: `Order amount exceeds maximum. Amount: $${amount}, Max: $${checks.positionSize.max}`,
          checks,
        };
      }

      // 3. 检查每日交易限额（默认 $5,000）
      const todayUsed = await tradeStatsService.getTodayTradeVolume(userId);
      checks.dailyLimit.used = todayUsed;
      checks.dailyLimit.passed = todayUsed + amount <= checks.dailyLimit.limit;

      console.log(`   📅 Daily Limit: $${todayUsed.toFixed(2)} / $${checks.dailyLimit.limit} (Adding: $${amount})`);

      if (!checks.dailyLimit.passed) {
        return {
          passed: false,
          reason: `Daily trading limit exceeded. Used: $${todayUsed.toFixed(2)}, Limit: $${checks.dailyLimit.limit}`,
          checks,
        };
      }

      // 所有检查通过
      console.log(`✅ All risk checks passed`);
      return {
        passed: true,
        checks,
      };
    } catch (error: any) {
      console.error(`❌ Risk check error: ${error.message}`);
      return {
        passed: false,
        reason: `Risk check error: ${error.message}`,
        checks,
      };
    }
  }

  /**
   * 获取当前市场价
   */
  async getCurrentPrice(symbol: string): Promise<number> {
    return await binanceService.getCurrentPrice(symbol);
  }

  /**
   * 计算购买数量
   */
  calculateQuantity(usdtAmount: number, currentPrice: number, symbol: string): number {
    const baseQuantity = usdtAmount / currentPrice;

    // 根据交易对调整精度
    // BTC: 0.00001, ETH: 0.0001, BNB: 0.01
    let precision = 0.00001; // Default for BTC
    if (symbol.includes('ETH')) precision = 0.0001;
    if (symbol.includes('BNB')) precision = 0.01;

    // 向下取整到指定精度
    const quantity = Math.floor(baseQuantity / precision) * precision;

    return quantity;
  }

  /**
   * 下单（调用 Binance API）
   */
  async placeOrder(params: {
    apiKey: string;
    apiSecret: string;
    symbol: string;
    side: 'BUY' | 'SELL';
    quantity: number;
    type: 'MARKET' | 'LIMIT';
    price?: number;
  }): Promise<OrderResult> {
    const { apiKey, apiSecret, symbol, side, quantity, type, price } = params;

    try {
      // 调用 Binance 下单 API
      const order = await binanceService.createOrder(
        apiKey,
        apiSecret,
        symbol,
        side,
        type,
        quantity,
        price
      );

      return {
        success: true,
        orderId: order.orderId.toString(),
        executedQty: parseFloat(order.executedQty),
        executedPrice: parseFloat(order.price || order.fills?.[0]?.price || '0'),
        status: order.status,
      };
    } catch (error: any) {
      throw new Error(`Binance order failed: ${error.message}`);
    }
  }

  /**
   * 记录订单到数据库
   */
  async logOrder(
    userId: string,
    signalId: string | undefined,
    orderResult: OrderResult,
    orderRequest: OrderRequest
  ): Promise<void> {
    try {
      // 获取交易者 ID（从信号中）
      let traderId: string | null = null;
      if (signalId) {
        const signal = await prisma.binanceTradingSignal.findUnique({
          where: { id: signalId },
          include: {
            strategy: {
              select: { traderId: true },
            },
          },
        });
        traderId = signal?.strategy?.traderId || null;
      }

      // 创建交易记录
      const record = await prisma.copyTradeRecord.create({
        data: {
          userId,
          signalId: signalId || null,
          traderId,
          symbol: orderRequest.symbol,
          side: orderRequest.side,
          orderType: orderRequest.type || 'MARKET',
          binanceOrderId: orderResult.orderId || 'MOCK_ORDER',
          status: orderResult.success ? 'FILLED' : 'FAILED',
          requestedAmount: orderRequest.amount.toString(),
          executedQty: orderResult.executedQty?.toString() || '0',
          executedPrice: orderResult.executedPrice?.toString() || '0',
          executedValue: (
            (orderResult.executedQty || 0) * (orderResult.executedPrice || 0)
          ).toString(),
          commission: '0', // TODO: 从订单详情中获取
          commissionAsset: 'BNB',
          mode: signalId ? 'auto' : 'manual',
          errorMessage: orderResult.error || null,
          executedAt: orderResult.success ? new Date() : null,
        },
      });

      console.log(`\n📝 Trade record created:`);
      console.log(`   Record ID: ${record.id}`);
      console.log(`   User: ${userId}`);
      if (signalId) console.log(`   Signal: ${signalId}`);
      if (traderId) console.log(`   Trader: ${traderId}`);
      console.log(`   Binance Order: ${record.binanceOrderId}`);
      console.log(`   Status: ${record.status}`);
      console.log(`   Executed Value: $${parseFloat(record.executedValue).toFixed(2)}`);
    } catch (error: any) {
      console.error(`❌ Failed to log trade record: ${error.message}`);
      // 不抛出错误，避免影响订单执行
    }
  }

  /**
   * 查询订单状态
   */
  async getOrderStatus(userId: string, orderId: string, symbol: string): Promise<any> {
    try {
      const apiKey = await prisma.binanceApiKey.findFirst({
        where: { userId, isActive: true },
      });

      if (!apiKey) {
        throw new Error('No active API key found');
      }

      const decryptedKey = decrypt(apiKey.apiKeyEncrypted);
      const decryptedSecret = decrypt(apiKey.apiSecretEncrypted);

      const order = await binanceService.getOrder(decryptedKey, decryptedSecret, symbol, orderId);

      return {
        orderId: order.orderId,
        symbol: order.symbol,
        status: order.status,
        side: order.side,
        type: order.type,
        price: parseFloat(order.price),
        executedQty: parseFloat(order.executedQty),
        cummulativeQuoteQty: parseFloat(order.cummulativeQuoteQty),
        time: new Date(order.time),
        updateTime: new Date(order.updateTime),
      };
    } catch (error: any) {
      throw new Error(`Failed to get order status: ${error.message}`);
    }
  }

  /**
   * 取消订单
   */
  async cancelOrder(userId: string, orderId: string, symbol: string): Promise<any> {
    try {
      const apiKey = await prisma.binanceApiKey.findFirst({
        where: { userId, isActive: true },
      });

      if (!apiKey) {
        throw new Error('No active API key found');
      }

      const decryptedKey = decrypt(apiKey.apiKeyEncrypted);
      const decryptedSecret = decrypt(apiKey.apiSecretEncrypted);

      const result = await binanceService.cancelOrder(decryptedKey, decryptedSecret, symbol, orderId);

      console.log(`✅ Order ${orderId} cancelled successfully`);

      return result;
    } catch (error: any) {
      throw new Error(`Failed to cancel order: ${error.message}`);
    }
  }
}

// 单例导出
export const orderExecutionService = new OrderExecutionService();
