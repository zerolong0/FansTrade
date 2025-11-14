/**
 * Binance WebSocket Service - 实时数据推送
 * 提供价格、K线、订单薄等实时数据流
 */

import { WebsocketClient } from 'binance';
import { EventEmitter } from 'events';

// 事件类型定义
export interface TickerEvent {
  symbol: string;
  price: string;
  priceChange: string;
  priceChangePercent: string;
  volume: string;
  timestamp: number;
}

export interface KlineEvent {
  symbol: string;
  interval: string;
  openTime: number;
  closeTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  isClosed: boolean;
}

export interface OrderBookEvent {
  symbol: string;
  bids: Array<[string, string]>;  // [price, quantity]
  asks: Array<[string, string]>;
  timestamp: number;
}

/**
 * WebSocket 服务类
 */
export class BinanceWebSocketService extends EventEmitter {
  private wsClient: WebsocketClient | null = null;
  private mockIntervals: Map<string, NodeJS.Timeout> = new Map();
  private isConnected: boolean = false;

  // 订阅管理
  private subscriptions: Set<string> = new Set();

  constructor() {
    super();
  }

  /**
   * 检查是否为 Mock 模式（动态检查环境变量）
   */
  private get isMockMode(): boolean {
    return process.env.BINANCE_MOCK_MODE === 'true';
  }

  /**
   * 检查是否为 Testnet 模式（动态检查环境变量）
   */
  private get isTestnet(): boolean {
    return process.env.BINANCE_TESTNET === 'true';
  }

  /**
   * 连接 WebSocket
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      console.warn('WebSocket already connected');
      return;
    }

    // Mock 模式：不建立真实连接
    if (this.isMockMode) {
      console.log('🎭 Mock mode: Simulating WebSocket connection');
      this.isConnected = true;
      this.emit('connected');
      return;
    }

    try {
      // 创建 WebSocket 客户端
      this.wsClient = new WebsocketClient({
        beautify: true,
        wsUrl: this.isTestnet ? 'wss://testnet.binance.vision/ws' : undefined,
      });

      // 监听连接事件
      this.wsClient.on('open', () => {
        console.log('✅ Binance WebSocket connected');
        this.isConnected = true;
        this.emit('connected');
      });

      // 监听错误事件
      this.wsClient.on('error', (error) => {
        console.error('❌ Binance WebSocket error:', error);
        this.emit('error', error);
      });

      // 监听关闭事件
      this.wsClient.on('close', () => {
        console.log('🔌 Binance WebSocket closed');
        this.isConnected = false;
        this.emit('disconnected');
      });

      // 监听重连事件
      this.wsClient.on('reconnected', () => {
        console.log('🔄 Binance WebSocket reconnected');
        this.isConnected = true;
        this.emit('reconnected');
      });

    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      throw error;
    }
  }

  /**
   * 订阅实时价格（24hr Ticker）
   */
  subscribeTicker(symbol: string): void {
    const key = `ticker:${symbol}`;
    if (this.subscriptions.has(key)) {
      console.warn(`Already subscribed to ticker: ${symbol}`);
      return;
    }

    this.subscriptions.add(key);

    // Mock 模式：模拟实时价格推送
    if (this.isMockMode) {
      this.startMockTicker(symbol);
      return;
    }

    // 真实模式：订阅 Binance WebSocket
    if (!this.wsClient) {
      throw new Error('WebSocket not connected');
    }

    this.wsClient.subscribe24hrTicker(symbol);

    // 监听价格更新
    this.wsClient.on('formattedMessage', (data: any) => {
      if (data.eventType === '24hrTicker' && data.symbol === symbol) {
        const tickerEvent: TickerEvent = {
          symbol: data.symbol,
          price: data.currentClose,
          priceChange: data.priceChange,
          priceChangePercent: data.priceChangePercent,
          volume: data.volume,
          timestamp: data.eventTime,
        };
        this.emit('ticker', tickerEvent);
      }
    });

    console.log(`✅ Subscribed to ticker: ${symbol}`);
  }

  /**
   * 订阅 K 线数据
   */
  subscribeKline(symbol: string, interval: string = '1m'): void {
    const key = `kline:${symbol}:${interval}`;
    if (this.subscriptions.has(key)) {
      console.warn(`Already subscribed to kline: ${symbol} ${interval}`);
      return;
    }

    this.subscriptions.add(key);

    // Mock 模式：模拟 K 线推送
    if (this.isMockMode) {
      this.startMockKline(symbol, interval);
      return;
    }

    // 真实模式：订阅 Binance WebSocket
    if (!this.wsClient) {
      throw new Error('WebSocket not connected');
    }

    this.wsClient.subscribeKlines(symbol, interval);

    // 监听 K 线更新
    this.wsClient.on('formattedMessage', (data: any) => {
      if (data.eventType === 'kline' && data.symbol === symbol && data.kline.interval === interval) {
        const klineEvent: KlineEvent = {
          symbol: data.symbol,
          interval: data.kline.interval,
          openTime: data.kline.startTime,
          closeTime: data.kline.closeTime,
          open: data.kline.open,
          high: data.kline.high,
          low: data.kline.low,
          close: data.kline.close,
          volume: data.kline.volume,
          isClosed: data.kline.isFinal,
        };
        this.emit('kline', klineEvent);
      }
    });

    console.log(`✅ Subscribed to kline: ${symbol} ${interval}`);
  }

  /**
   * 订阅订单薄（深度数据）
   */
  subscribeOrderBook(symbol: string): void {
    const key = `orderbook:${symbol}`;
    if (this.subscriptions.has(key)) {
      console.warn(`Already subscribed to order book: ${symbol}`);
      return;
    }

    this.subscriptions.add(key);

    // Mock 模式：模拟订单薄推送
    if (this.isMockMode) {
      this.startMockOrderBook(symbol);
      return;
    }

    // 真实模式：订阅 Binance WebSocket
    if (!this.wsClient) {
      throw new Error('WebSocket not connected');
    }

    this.wsClient.subscribePartialBookDepth(symbol, 10);

    // 监听订单薄更新
    this.wsClient.on('formattedMessage', (data: any) => {
      if (data.eventType === 'depthUpdate' && data.symbol === symbol) {
        const orderBookEvent: OrderBookEvent = {
          symbol: data.symbol,
          bids: data.bids,
          asks: data.asks,
          timestamp: data.eventTime,
        };
        this.emit('orderbook', orderBookEvent);
      }
    });

    console.log(`✅ Subscribed to order book: ${symbol}`);
  }

  /**
   * 取消订阅
   */
  unsubscribe(type: 'ticker' | 'kline' | 'orderbook', symbol: string, interval?: string): void {
    const key = interval ? `${type}:${symbol}:${interval}` : `${type}:${symbol}`;

    if (!this.subscriptions.has(key)) {
      console.warn(`Not subscribed to: ${key}`);
      return;
    }

    this.subscriptions.delete(key);

    // Mock 模式：停止模拟数据
    if (this.isMockMode) {
      const mockKey = interval ? `${symbol}:${interval}` : symbol;
      const timer = this.mockIntervals.get(mockKey);
      if (timer) {
        clearInterval(timer);
        this.mockIntervals.delete(mockKey);
      }
      console.log(`✅ Unsubscribed from mock: ${key}`);
      return;
    }

    // 真实模式：取消 WebSocket 订阅
    if (!this.wsClient) {
      return;
    }

    // 注意：binance SDK 没有直接的 unsubscribe 方法，需要关闭并重新连接
    // 在生产环境中，可以考虑维护多个 WebSocket 连接或使用更细粒度的订阅管理
    console.log(`⚠️  Unsubscribe requires reconnection: ${key}`);
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    if (!this.isConnected) {
      return;
    }

    // 清理所有 Mock 定时器
    for (const timer of this.mockIntervals.values()) {
      clearInterval(timer);
    }
    this.mockIntervals.clear();
    this.subscriptions.clear();

    // 关闭真实 WebSocket 连接
    if (this.wsClient) {
      this.wsClient.closeAll();
      this.wsClient = null;
    }

    this.isConnected = false;
    console.log('✅ WebSocket disconnected');
    this.emit('disconnected');
  }

  /**
   * 检查连接状态
   */
  isConnectedStatus(): boolean {
    return this.isConnected;
  }

  /**
   * 获取当前订阅列表
   */
  getSubscriptions(): string[] {
    return Array.from(this.subscriptions);
  }

  // ==================== Mock 模式实现 ====================

  /**
   * 模拟实时价格推送
   */
  private startMockTicker(symbol: string): void {
    const basePrice = symbol === 'BTCUSDT' ? 89500 : symbol === 'ETHUSDT' ? 3200 : 620;
    let currentPrice = basePrice;

    const interval = setInterval(() => {
      // 模拟价格波动 (±0.1%)
      const change = (Math.random() - 0.5) * basePrice * 0.002;
      currentPrice += change;

      const tickerEvent: TickerEvent = {
        symbol,
        price: currentPrice.toFixed(2),
        priceChange: change.toFixed(2),
        priceChangePercent: ((change / basePrice) * 100).toFixed(2),
        volume: (Math.random() * 1000).toFixed(2),
        timestamp: Date.now(),
      };

      this.emit('ticker', tickerEvent);
    }, 1000); // 每秒推送一次

    this.mockIntervals.set(symbol, interval);
    console.log(`🎭 Mock ticker started: ${symbol}`);
  }

  /**
   * 模拟 K 线推送
   */
  private startMockKline(symbol: string, interval: string): void {
    const basePrice = symbol === 'BTCUSDT' ? 89500 : symbol === 'ETHUSDT' ? 3200 : 620;
    let currentOpen = basePrice;
    let currentHigh = basePrice;
    let currentLow = basePrice;
    let currentClose = basePrice;

    const timer = setInterval(() => {
      // 模拟 K 线更新
      const change = (Math.random() - 0.5) * basePrice * 0.002;
      currentClose = currentOpen + change;
      currentHigh = Math.max(currentHigh, currentClose);
      currentLow = Math.min(currentLow, currentClose);

      const klineEvent: KlineEvent = {
        symbol,
        interval,
        openTime: Date.now() - 60000, // 1分钟前
        closeTime: Date.now(),
        open: currentOpen.toFixed(2),
        high: currentHigh.toFixed(2),
        low: currentLow.toFixed(2),
        close: currentClose.toFixed(2),
        volume: (Math.random() * 100).toFixed(4),
        isClosed: Math.random() > 0.9, // 10% 概率为已完成的 K 线
      };

      this.emit('kline', klineEvent);

      // 如果 K 线已关闭，重置为新 K 线
      if (klineEvent.isClosed) {
        currentOpen = currentClose;
        currentHigh = currentClose;
        currentLow = currentClose;
      }
    }, 2000); // 每2秒推送一次

    this.mockIntervals.set(`${symbol}:${interval}`, timer);
    console.log(`🎭 Mock kline started: ${symbol} ${interval}`);
  }

  /**
   * 模拟订单薄推送
   */
  private startMockOrderBook(symbol: string): void {
    const basePrice = symbol === 'BTCUSDT' ? 89500 : symbol === 'ETHUSDT' ? 3200 : 620;

    const timer = setInterval(() => {
      // 生成模拟买卖盘
      const bids: Array<[string, string]> = [];
      const asks: Array<[string, string]> = [];

      for (let i = 0; i < 10; i++) {
        const bidPrice = basePrice - (i + 1) * (basePrice * 0.0001);
        const askPrice = basePrice + (i + 1) * (basePrice * 0.0001);
        const quantity = (Math.random() * 10).toFixed(4);

        bids.push([bidPrice.toFixed(2), quantity]);
        asks.push([askPrice.toFixed(2), quantity]);
      }

      const orderBookEvent: OrderBookEvent = {
        symbol,
        bids,
        asks,
        timestamp: Date.now(),
      };

      this.emit('orderbook', orderBookEvent);
    }, 3000); // 每3秒推送一次

    this.mockIntervals.set(`orderbook:${symbol}`, timer);
    console.log(`🎭 Mock order book started: ${symbol}`);
  }
}

// 单例导出
export const binanceWebSocketService = new BinanceWebSocketService();
