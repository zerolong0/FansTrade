/**
 * Test script for Binance Service
 * Usage: npx tsx src/scripts/test-binance.ts
 */

import dotenv from 'dotenv';
dotenv.config({ override: true });

import { binanceService } from '../services/binance/binance.service';
import { redis } from '../services/redis.service';

async function testBinance() {
  console.log('🔧 Testing Binance Service...\n');

  // 1. 连接 Redis
  console.log('Test 1: Connect to Redis');
  try {
    await redis.connect();
    console.log(`✅ Redis connection: ${redis.isReady() ? 'connected' : 'disconnected'}\n`);
  } catch (error) {
    console.log('⚠️  Redis not available, continuing without cache\n');
  }

  // 2. 获取实时价格
  console.log('Test 2: Get BTC/USDT current price');
  try {
    const btcPrice = await binanceService.getCurrentPrice('BTCUSDT');
    console.log(`✅ BTC/USDT price: $${btcPrice.toLocaleString()}\n`);
  } catch (error: any) {
    console.error(`❌ Get price failed: ${error.message}\n`);
  }

  // 3. 获取 K 线数据
  console.log('Test 3: Get BTC/USDT 1h klines (last 10)');
  try {
    const klines = await binanceService.getKlines('BTCUSDT', '1h', 10);
    console.log(`✅ Retrieved ${klines.length} klines`);
    console.log(`   Latest close: $${parseFloat(klines[klines.length - 1].close).toLocaleString()}`);
    console.log(`   Volume: ${parseFloat(klines[klines.length - 1].volume).toFixed(2)} BTC\n`);
  } catch (error: any) {
    console.error(`❌ Get klines failed: ${error.message}\n`);
  }

  // 4. 测试缓存
  console.log('Test 4: Test Redis caching');
  if (redis.isReady()) {
    try {
      // 第一次调用（从 Binance 获取）
      const start1 = Date.now();
      const price1 = await binanceService.getCurrentPrice('ETHUSDT');
      const time1 = Date.now() - start1;
      console.log(`   First call (from Binance): ${time1}ms`);

      // 第二次调用（从缓存获取）
      const start2 = Date.now();
      const price2 = await binanceService.getCurrentPrice('ETHUSDT');
      const time2 = Date.now() - start2;
      console.log(`   Second call (from cache): ${time2}ms`);
      console.log(`✅ Cache speedup: ${(time1 / time2).toFixed(1)}x faster\n`);
    } catch (error: any) {
      console.error(`❌ Cache test failed: ${error.message}\n`);
    }
  } else {
    console.log('⚠️  Redis not available, skipping cache test\n');
  }

  // 5. 获取交易对信息
  console.log('Test 5: Get exchange info (sample)');
  try {
    const exchangeInfo = await binanceService.getExchangeInfo();
    const usdtPairs = exchangeInfo.symbols.filter((s: any) => s.quoteAsset === 'USDT');
    console.log(`✅ Total symbols: ${exchangeInfo.symbols.length}`);
    console.log(`   USDT pairs: ${usdtPairs.length}`);
    console.log(`   Sample: ${usdtPairs.slice(0, 5).map((s: any) => s.symbol).join(', ')}\n`);
  } catch (error: any) {
    console.error(`❌ Get exchange info failed: ${error.message}\n`);
  }

  // 6. 同步交易对（这会写入数据库）
  console.log('Test 6: Sync trading pairs to database');
  try {
    const syncCount = await binanceService.syncTradingPairs();
    console.log(`✅ Synced ${syncCount} trading pairs to database\n`);
  } catch (error: any) {
    console.error(`❌ Sync failed: ${error.message}\n`);
  }

  // 7. 测试 API Key 验证（需要有效的 API Key）
  console.log('Test 7: Validate API Key');
  const testApiKey = process.env.BINANCE_API_KEY_TEST;
  const testApiSecret = process.env.BINANCE_API_SECRET_TEST;

  if (testApiKey && testApiSecret) {
    try {
      const isValid = await binanceService.validateApiKey(testApiKey, testApiSecret);
      console.log(`✅ API Key validation: ${isValid ? 'valid' : 'invalid'}\n`);
    } catch (error: any) {
      console.error(`❌ API Key validation failed: ${error.message}\n`);
    }
  } else {
    console.log('⚠️  No test API Key provided, skipping validation test');
    console.log('   Set BINANCE_API_KEY_TEST and BINANCE_API_SECRET_TEST to test\n');
  }

  // 清理
  await redis.disconnect();

  console.log('🎉 All tests completed!');
}

testBinance().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
