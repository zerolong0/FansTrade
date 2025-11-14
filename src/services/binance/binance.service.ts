/**
 * Binance Service - 核心 API 封装
 * 提供市场数据、账户查询、交易功能
 */

import { MainClient, OrderSide, OrderType } from 'binance';
import { PrismaClient } from '@prisma/client';
import { decrypt } from '../crypto.service';
import { redis } from '../redis.service';

const prisma = new PrismaClient();

// 类型定义
export interface Balance {
  asset: string;
  free: string;
  locked: string;
}

export interface Kline {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteVolume: string;
  trades: number;
  takerBaseVolume: string;
  takerQuoteVolume: string;
}

export interface MarketOrderParams {
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
}

export interface LimitOrderParams extends MarketOrderParams {
  price: number;
  timeInForce?: 'GTC' | 'IOC' | 'FOK';
}

export interface OrderResult {
  orderId: string;
  symbol: string;
  status: string;
  executedQty: string;
  fills: Array<{
    price: string;
    qty: string;
    commission: string;
    commissionAsset: string;
  }>;
}

export class BinanceService {
  private publicClient: MainClient;
  private privateClients: Map<string, MainClient> = new Map();
  private isTestnet: boolean;
  private isMockMode: boolean;

  constructor() {
    // 检查模式
    this.isMockMode = process.env.BINANCE_MOCK_MODE === 'true';
    this.isTestnet = process.env.BINANCE_TESTNET === 'true';

    // 初始化公共客户端（无需 API Key）
    this.publicClient = new MainClient({
      baseUrl: this.isTestnet ? 'https://testnet.binance.vision' : undefined,
    });

    if (this.isMockMode) {
      console.log('🎭 Binance Service: Using MOCK mode (simulated data)');
    } else if (this.isTestnet) {
      console.log('🧪 Binance Service: Using TESTNET mode');
    }
  }

  /**
   * 获取公共客户端（市场数据）
   */
  getPublicClient(): MainClient {
    return this.publicClient;
  }

  /**
   * 获取私有客户端（需要用户 API Key）
   */
  async getPrivateClient(userId: string): Promise<MainClient> {
    // 检查缓存
    if (this.privateClients.has(userId)) {
      return this.privateClients.get(userId)!;
    }

    // 从数据库获取 API Key
    const apiKey = await prisma.binanceApiKey.findFirst({
      where: {
        userId,
        isActive: true,
      },
    });

    if (!apiKey) {
      throw new Error('No active Binance API key found for this user');
    }

    // 解密 API Key
    const decryptedKey = decrypt(apiKey.apiKeyEncrypted);
    const decryptedSecret = decrypt(apiKey.apiSecretEncrypted);

    // 创建授权客户端
    const client = new MainClient({
      api_key: decryptedKey,
      api_secret: decryptedSecret,
      baseUrl: this.isTestnet ? 'https://testnet.binance.vision' : undefined,
    });

    // 缓存客户端
    this.privateClients.set(userId, client);

    // 更新最后使用时间
    await prisma.binanceApiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    });

    return client;
  }

  /**
   * 获取实时价格（带 Redis 缓存，5 秒 TTL）
   */
  async getCurrentPrice(symbol: string): Promise<number> {
    // Mock 模式：返回模拟数据
    if (this.isMockMode) {
      const mockPrices: Record<string, number> = {
        BTCUSDT: 89500 + Math.random() * 500,  // BTC价格在 89500-90000 之间波动
        ETHUSDT: 3200 + Math.random() * 100,    // ETH价格在 3200-3300 之间波动
        BNBUSDT: 620 + Math.random() * 10,      // BNB价格在 620-630 之间波动
      };
      return mockPrices[symbol] || 100 + Math.random() * 10;
    }

    const cacheKey = `binance:price:${symbol}`;

    try {
      // 尝试从 Redis 获取
      const cached = await redis.get(cacheKey);
      if (cached) {
        return parseFloat(cached);
      }
    } catch (error) {
      console.warn('Redis get error:', error);
    }

    // 从 Binance 获取
    try {
      const ticker = await this.publicClient.getSymbolPriceTicker({ symbol });
      const price = parseFloat(ticker.price);

      // 缓存 5 秒
      try {
        await redis.setex(cacheKey, 5, price.toString());
      } catch (error) {
        console.warn('Redis set error:', error);
      }

      return price;
    } catch (error: any) {
      console.error(`Get price error for ${symbol}:`, error);
      throw new Error(`Failed to get price for ${symbol}: ${error.message}`);
    }
  }

  /**
   * 获取 K 线数据（带 Redis 缓存，60 秒 TTL）
   */
  async getKlines(
    symbol: string,
    interval: string = '1h',
    limit: number = 100
  ): Promise<Kline[]> {
    // Mock 模式：返回模拟数据
    if (this.isMockMode) {
      const now = Date.now();
      const intervalMs = 3600000; // 1小时
      const basePrice = symbol === 'BTCUSDT' ? 89500 : symbol === 'ETHUSDT' ? 3200 : 620;

      return Array.from({ length: limit }, (_, i) => {
        const openTime = now - (limit - i) * intervalMs;
        const volatility = basePrice * 0.002; // 0.2% 波动
        const open = basePrice + (Math.random() - 0.5) * volatility * 2;
        const close = open + (Math.random() - 0.5) * volatility;
        const high = Math.max(open, close) + Math.random() * volatility;
        const low = Math.min(open, close) - Math.random() * volatility;
        const volume = 100 + Math.random() * 100;

        return {
          openTime,
          open: open.toFixed(2),
          high: high.toFixed(2),
          low: low.toFixed(2),
          close: close.toFixed(2),
          volume: volume.toFixed(4),
          closeTime: openTime + intervalMs - 1,
          quoteVolume: (open * volume).toFixed(2),
          trades: Math.floor(Math.random() * 1000),
          takerBaseVolume: (volume * 0.6).toFixed(4),
          takerQuoteVolume: (open * volume * 0.6).toFixed(2),
        };
      });
    }

    const cacheKey = `binance:klines:${symbol}:${interval}:${limit}`;

    try {
      // 尝试从 Redis 获取
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.warn('Redis get error:', error);
    }

    // 从 Binance 获取
    try {
      const klines = await this.publicClient.getKlines({
        symbol,
        interval,
        limit,
      });

      const formattedKlines: Kline[] = klines.map((k: any) => ({
        openTime: k[0],
        open: k[1],
        high: k[2],
        low: k[3],
        close: k[4],
        volume: k[5],
        closeTime: k[6],
        quoteVolume: k[7],
        trades: k[8],
        takerBaseVolume: k[9],
        takerQuoteVolume: k[10],
      }));

      // 缓存 60 秒
      try {
        await redis.setex(cacheKey, 60, JSON.stringify(formattedKlines));
      } catch (error) {
        console.warn('Redis set error:', error);
      }

      return formattedKlines;
    } catch (error: any) {
      console.error(`Get klines error for ${symbol}:`, error);
      throw new Error(`Failed to get klines for ${symbol}: ${error.message}`);
    }
  }

  /**
   * 获取交易所信息（交易对配置）
   */
  async getExchangeInfo(): Promise<any> {
    // Mock 模式：返回模拟数据
    if (this.isMockMode) {
      const mockSymbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'DOGEUSDT',
                           'SOLUSDT', 'MATICUSDT', 'DOTUSDT', 'AVAXUSDT', 'LINKUSDT'];

      return {
        timezone: 'UTC',
        serverTime: Date.now(),
        symbols: mockSymbols.map(symbol => ({
          symbol,
          baseAsset: symbol.replace('USDT', ''),
          quoteAsset: 'USDT',
          status: 'TRADING',
          filters: [
            { filterType: 'PRICE_FILTER', minPrice: '0.01', maxPrice: '1000000', tickSize: '0.01' },
            { filterType: 'LOT_SIZE', minQty: '0.00001', maxQty: '9000', stepSize: '0.00001' },
            { filterType: 'NOTIONAL', minNotional: '10' }
          ]
        }))
      };
    }

    const cacheKey = 'binance:exchangeInfo';

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.warn('Redis get error:', error);
    }

    try {
      const info = await this.publicClient.getExchangeInfo();

      // 缓存 1 小时
      try {
        await redis.setex(cacheKey, 3600, JSON.stringify(info));
      } catch (error) {
        console.warn('Redis set error:', error);
      }

      return info;
    } catch (error: any) {
      console.error('Get exchange info error:', error);
      throw new Error(`Failed to get exchange info: ${error.message}`);
    }
  }

  /**
   * 获取账户余额（使用 userId）
   */
  async getAccountBalance(userId: string): Promise<Balance[]> {
    const client = await this.getPrivateClient(userId);

    try {
      const accountInfo = await client.getAccountInformation();

      // 只返回余额不为 0 的资产
      const balances: Balance[] = accountInfo.balances
        .filter((b: any) => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0)
        .map((b: any) => ({
          asset: b.asset,
          free: b.free,
          locked: b.locked,
        }));

      return balances;
    } catch (error: any) {
      console.error('Get account balance error:', error);
      throw new Error(`Failed to get account balance: ${error.message}`);
    }
  }

  /**
   * 获取指定资产的账户余额（使用 API Key，支持 MOCK 模式）
   */
  async getAssetBalance(apiKey: string, apiSecret: string, asset: string): Promise<Balance> {
    // Mock 模式：返回模拟余额
    if (this.isMockMode) {
      return {
        asset,
        free: '10000.00',    // 模拟 10000 USDT 余额
        locked: '0.00',
      };
    }

    const client = new MainClient({
      apiKey,
      apiSecret,
    });

    try {
      const accountInfo = await client.getAccountInformation();
      const balance = accountInfo.balances.find((b: any) => b.asset === asset);

      if (!balance) {
        return {
          asset,
          free: '0',
          locked: '0',
        };
      }

      return {
        asset: balance.asset,
        free: balance.free,
        locked: balance.locked,
      };
    } catch (error: any) {
      console.error(`Get asset balance error for ${asset}:`, error);
      throw new Error(`Failed to get balance for ${asset}: ${error.message}`);
    }
  }

  /**
   * 获取账户信息
   */
  async getAccountInfo(userId: string): Promise<any> {
    const client = await this.getPrivateClient(userId);

    try {
      const accountInfo = await client.getAccountInformation();
      return accountInfo;
    } catch (error: any) {
      console.error('Get account info error:', error);
      throw new Error(`Failed to get account info: ${error.message}`);
    }
  }

  /**
   * 获取当前挂单
   */
  async getOpenOrders(userId: string, symbol?: string): Promise<any[]> {
    const client = await this.getPrivateClient(userId);

    try {
      const orders = await client.getOpenOrders(symbol ? { symbol } : undefined);
      return orders;
    } catch (error: any) {
      console.error('Get open orders error:', error);
      throw new Error(`Failed to get open orders: ${error.message}`);
    }
  }

  /**
   * 市价单下单
   */
  async placeMarketOrder(
    userId: string,
    params: MarketOrderParams
  ): Promise<OrderResult> {
    const client = await this.getPrivateClient(userId);

    try {
      const order = await client.submitNewOrder({
        symbol: params.symbol,
        side: params.side as OrderSide,
        type: 'MARKET' as OrderType,
        quantity: params.quantity,
      });

      console.log(`✅ Market order placed: ${params.side} ${params.quantity} ${params.symbol}`);

      return {
        orderId: order.orderId.toString(),
        symbol: order.symbol,
        status: order.status,
        executedQty: order.executedQty,
        fills: order.fills.map((f: any) => ({
          price: f.price,
          qty: f.qty,
          commission: f.commission,
          commissionAsset: f.commissionAsset,
        })),
      };
    } catch (error: any) {
      console.error('Place market order error:', error);
      throw new Error(`Failed to place market order: ${error.message}`);
    }
  }

  /**
   * 限价单下单
   */
  async placeLimitOrder(
    userId: string,
    params: LimitOrderParams
  ): Promise<OrderResult> {
    const client = await this.getPrivateClient(userId);

    try {
      const order = await client.submitNewOrder({
        symbol: params.symbol,
        side: params.side as OrderSide,
        type: 'LIMIT' as OrderType,
        quantity: params.quantity,
        price: params.price,
        timeInForce: params.timeInForce || 'GTC',
      });

      console.log(
        `✅ Limit order placed: ${params.side} ${params.quantity} ${params.symbol} @ ${params.price}`
      );

      return {
        orderId: order.orderId.toString(),
        symbol: order.symbol,
        status: order.status,
        executedQty: order.executedQty,
        fills: order.fills.map((f: any) => ({
          price: f.price,
          qty: f.qty,
          commission: f.commission,
          commissionAsset: f.commissionAsset,
        })),
      };
    } catch (error: any) {
      console.error('Place limit order error:', error);
      throw new Error(`Failed to place limit order: ${error.message}`);
    }
  }

  /**
   * 通用下单（使用 API Key 直接调用）
   */
  async createOrder(
    apiKey: string,
    apiSecret: string,
    symbol: string,
    side: 'BUY' | 'SELL',
    type: 'MARKET' | 'LIMIT',
    quantity: number,
    price?: number
  ): Promise<any> {
    // Mock 模式：返回模拟订单
    if (this.isMockMode) {
      // For MARKET orders, use current market price
      let executedPrice: string;
      if (type === 'MARKET' && !price) {
        const currentPrice = await this.getCurrentPrice(symbol);
        executedPrice = currentPrice.toString();
      } else {
        executedPrice = price?.toString() || '0';
      }

      const mockOrder = {
        orderId: Math.floor(Math.random() * 1000000),
        symbol,
        side,
        type,
        price: executedPrice,
        executedQty: quantity.toString(),
        status: 'FILLED',
        fills: [
          {
            price: executedPrice,
            qty: quantity.toString(),
            commission: '0.001',
            commissionAsset: 'BNB',
          },
        ],
      };
      console.log(`🎭 Mock order created: ${mockOrder.orderId}`);
      return mockOrder;
    }

    try {
      const client = new MainClient({
        api_key: apiKey,
        api_secret: apiSecret,
        baseUrl: this.isTestnet ? 'https://testnet.binance.vision' : undefined,
      });

      const orderParams: any = {
        symbol,
        side,
        type,
        quantity,
      };

      if (type === 'LIMIT') {
        orderParams.price = price;
        orderParams.timeInForce = 'GTC';
      }

      const order = await client.submitNewOrder(orderParams);

      console.log(`✅ Order created: ${order.orderId} (${type} ${side} ${quantity} ${symbol})`);

      return order;
    } catch (error: any) {
      console.error('Create order error:', error);
      throw new Error(`Failed to create order: ${error.message}`);
    }
  }

  /**
   * 查询订单状态（使用 API Key 直接调用）
   */
  async getOrder(
    apiKey: string,
    apiSecret: string,
    symbol: string,
    orderId: string
  ): Promise<any> {
    // Mock 模式：返回模拟订单状态
    if (this.isMockMode) {
      const mockOrder = {
        orderId: parseInt(orderId),
        symbol,
        status: 'FILLED',
        side: 'BUY',
        type: 'MARKET',
        price: '0',
        executedQty: '0.001',
        cummulativeQuoteQty: '100',
        time: Date.now(),
        updateTime: Date.now(),
      };
      console.log(`🎭 Mock order status: ${mockOrder.orderId}`);
      return mockOrder;
    }

    try {
      const client = new MainClient({
        api_key: apiKey,
        api_secret: apiSecret,
        baseUrl: this.isTestnet ? 'https://testnet.binance.vision' : undefined,
      });

      const order = await client.getOrder({
        symbol,
        orderId: parseInt(orderId),
      });

      return order;
    } catch (error: any) {
      console.error('Get order error:', error);
      throw new Error(`Failed to get order: ${error.message}`);
    }
  }

  /**
   * 取消订单（使用 API Key 直接调用）
   */
  async cancelOrder(
    apiKey: string,
    apiSecret: string,
    symbol: string,
    orderId: string
  ): Promise<any> {
    // Mock 模式：返回成功
    if (this.isMockMode) {
      console.log(`🎭 Mock order cancelled: ${orderId}`);
      return { orderId: parseInt(orderId), status: 'CANCELED' };
    }

    try {
      const client = new MainClient({
        api_key: apiKey,
        api_secret: apiSecret,
        baseUrl: this.isTestnet ? 'https://testnet.binance.vision' : undefined,
      });

      const result = await client.cancelOrder({
        symbol,
        orderId: parseInt(orderId),
      });

      console.log(`✅ Order cancelled: ${orderId} for ${symbol}`);
      return result;
    } catch (error: any) {
      console.error('Cancel order error:', error);
      throw new Error(`Failed to cancel order: ${error.message}`);
    }
  }

  /**
   * 验证 API Key 有效性
   */
  async validateApiKey(apiKey: string, apiSecret: string): Promise<boolean> {
    // Mock 模式：直接返回成功
    if (this.isMockMode) {
      console.log('🎭 Mock mode: API Key validation always returns true');
      return true;
    }

    try {
      const client = new MainClient({
        api_key: apiKey,
        api_secret: apiSecret,
        baseUrl: this.isTestnet ? 'https://testnet.binance.vision' : undefined,
      });

      // 尝试获取账户信息
      await client.getAccountInformation();

      return true;
    } catch (error) {
      console.error('Validate API key error:', error);
      return false;
    }
  }

  /**
   * 同步交易对信息到数据库
   */
  async syncTradingPairs(): Promise<number> {
    console.log('🔄 Syncing trading pairs from Binance...');

    try {
      const exchangeInfo = await this.getExchangeInfo();
      let syncCount = 0;

      for (const symbol of exchangeInfo.symbols) {
        // 只同步 USDT 交易对
        if (symbol.quoteAsset !== 'USDT') {
          continue;
        }

        // 提取交易规则
        const priceFilter = symbol.filters.find((f: any) => f.filterType === 'PRICE_FILTER');
        const lotSizeFilter = symbol.filters.find((f: any) => f.filterType === 'LOT_SIZE');
        const minNotionalFilter = symbol.filters.find((f: any) => f.filterType === 'NOTIONAL' || f.filterType === 'MIN_NOTIONAL');

        await prisma.tradingPair.upsert({
          where: { symbol: symbol.symbol },
          update: {
            status: symbol.status,
            minPrice: priceFilter?.minPrice || '0',
            maxPrice: priceFilter?.maxPrice || '0',
            tickSize: priceFilter?.tickSize || '0',
            minQty: lotSizeFilter?.minQty || '0',
            maxQty: lotSizeFilter?.maxQty || '0',
            stepSize: lotSizeFilter?.stepSize || '0',
            minNotional: minNotionalFilter?.minNotional || '0',
            isActive: symbol.status === 'TRADING',
            lastSyncAt: new Date(),
          },
          create: {
            symbol: symbol.symbol,
            baseAsset: symbol.baseAsset,
            quoteAsset: symbol.quoteAsset,
            status: symbol.status,
            minPrice: priceFilter?.minPrice || '0',
            maxPrice: priceFilter?.maxPrice || '0',
            tickSize: priceFilter?.tickSize || '0',
            minQty: lotSizeFilter?.minQty || '0',
            maxQty: lotSizeFilter?.maxQty || '0',
            stepSize: lotSizeFilter?.stepSize || '0',
            minNotional: minNotionalFilter?.minNotional || '0',
            isActive: symbol.status === 'TRADING',
          },
        });

        syncCount++;
      }

      console.log(`✅ Synced ${syncCount} trading pairs`);
      return syncCount;
    } catch (error: any) {
      console.error('Sync trading pairs error:', error);
      throw new Error(`Failed to sync trading pairs: ${error.message}`);
    }
  }
}

// 单例导出
export const binanceService = new BinanceService();
