/**
 * Test script for Binance WebSocket Service
 * Usage: npx tsx src/scripts/test-binance-websocket.ts
 */

import dotenv from 'dotenv';
dotenv.config({ override: true });

import { binanceWebSocketService, TickerEvent, KlineEvent, OrderBookEvent } from '../services/binance/binance-websocket.service';

async function testWebSocket() {
  console.log('🔧 Testing Binance WebSocket Service...\n');

  // 1. 连接 WebSocket
  console.log('Test 1: Connect to WebSocket');
  try {
    await binanceWebSocketService.connect();
    console.log(`✅ WebSocket connected: ${binanceWebSocketService.isConnectedStatus()}\n`);
  } catch (error: any) {
    console.error(`❌ Connection failed: ${error.message}\n`);
    return;
  }

  // 监听事件
  binanceWebSocketService.on('connected', () => {
    console.log('📡 Event: connected');
  });

  binanceWebSocketService.on('disconnected', () => {
    console.log('📡 Event: disconnected');
  });

  binanceWebSocketService.on('error', (error) => {
    console.error('📡 Event: error -', error);
  });

  // 2. 订阅实时价格
  console.log('Test 2: Subscribe to BTC/USDT ticker');
  let tickerCount = 0;
  binanceWebSocketService.on('ticker', (data: TickerEvent) => {
    tickerCount++;
    if (tickerCount <= 3) {
      console.log(`📊 Ticker update #${tickerCount}:`, {
        symbol: data.symbol,
        price: `$${parseFloat(data.price).toLocaleString()}`,
        change: `${data.priceChangePercent}%`,
        volume: parseFloat(data.volume).toFixed(2),
      });
    }
  });

  binanceWebSocketService.subscribeTicker('BTCUSDT');
  await sleep(3500); // 等待 3.5 秒，接收 3-4 次更新

  console.log(`✅ Received ${tickerCount} ticker updates\n`);

  // 3. 订阅 K 线数据
  console.log('Test 3: Subscribe to ETH/USDT 1m kline');
  let klineCount = 0;
  binanceWebSocketService.on('kline', (data: KlineEvent) => {
    klineCount++;
    if (klineCount <= 2) {
      console.log(`📈 Kline update #${klineCount}:`, {
        symbol: data.symbol,
        interval: data.interval,
        open: data.open,
        high: data.high,
        low: data.low,
        close: data.close,
        volume: data.volume,
        isClosed: data.isClosed,
      });
    }
  });

  binanceWebSocketService.subscribeKline('ETHUSDT', '1m');
  await sleep(4500); // 等待 4.5 秒，接收 2 次更新

  console.log(`✅ Received ${klineCount} kline updates\n`);

  // 4. 订阅订单薄
  console.log('Test 4: Subscribe to BNB/USDT order book');
  let orderbookCount = 0;
  binanceWebSocketService.on('orderbook', (data: OrderBookEvent) => {
    orderbookCount++;
    if (orderbookCount === 1) {
      console.log(`📖 Order book update:`, {
        symbol: data.symbol,
        bestBid: data.bids[0],
        bestAsk: data.asks[0],
        bidsCount: data.bids.length,
        asksCount: data.asks.length,
      });
    }
  });

  binanceWebSocketService.subscribeOrderBook('BNBUSDT');
  await sleep(3500); // 等待 3.5 秒，接收 1 次更新

  console.log(`✅ Received ${orderbookCount} order book update\n`);

  // 5. 查看订阅列表
  console.log('Test 5: Check subscriptions');
  const subscriptions = binanceWebSocketService.getSubscriptions();
  console.log(`✅ Active subscriptions (${subscriptions.length}):`, subscriptions);
  console.log('');

  // 6. 取消订阅
  console.log('Test 6: Unsubscribe from ticker');
  binanceWebSocketService.unsubscribe('ticker', 'BTCUSDT');
  const remainingSubscriptions = binanceWebSocketService.getSubscriptions();
  console.log(`✅ Remaining subscriptions (${remainingSubscriptions.length}):`, remainingSubscriptions);
  console.log('');

  // 7. 断开连接
  console.log('Test 7: Disconnect WebSocket');
  binanceWebSocketService.disconnect();
  console.log(`✅ WebSocket disconnected: ${!binanceWebSocketService.isConnectedStatus()}\n`);

  console.log('🎉 All WebSocket tests completed!');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

testWebSocket().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
