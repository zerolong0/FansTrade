/**
 * Test script for Market Data API
 * Usage: npx tsx src/scripts/test-market-api.ts
 */

import dotenv from 'dotenv';
dotenv.config({ override: true });

import { binanceService } from '../services/binance/binance.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testMarketAPI() {
  console.log('🔧 Testing Market Data Functions...\n');

  // 1. 同步交易对到数据库
  console.log('Test 1: Sync Trading Pairs');
  try {
    const syncCount = await binanceService.syncTradingPairs();
    console.log(`✅ Synced ${syncCount} trading pairs to database\n`);
  } catch (error: any) {
    console.error(`❌ Sync failed: ${error.message}\n`);
  }

  // 2. 查询交易对列表
  console.log('Test 2: Query Trading Pairs');
  try {
    const pairs = await prisma.tradingPair.findMany({
      where: { isActive: true },
      take: 5,
      select: {
        symbol: true,
        baseAsset: true,
        quoteAsset: true,
        status: true,
        minPrice: true,
        minQty: true,
        minNotional: true,
      },
    });
    console.log(`✅ Found ${pairs.length} active trading pairs (sample):`);
    pairs.forEach(pair => {
      console.log(`   - ${pair.symbol}: ${pair.baseAsset}/${pair.quoteAsset} (min: ${pair.minQty} ${pair.baseAsset})`);
    });
    console.log('');
  } catch (error: any) {
    console.error(`❌ Query failed: ${error.message}\n`);
  }

  // 3. 获取单个交易对详情
  console.log('Test 3: Get Single Trading Pair Detail');
  try {
    const pair = await prisma.tradingPair.findUnique({
      where: { symbol: 'BTCUSDT' },
    });
    if (pair) {
      console.log(`✅ BTCUSDT Details:`);
      console.log(`   Status: ${pair.status}`);
      console.log(`   Price Range: ${pair.minPrice} - ${pair.maxPrice}`);
      console.log(`   Quantity Range: ${pair.minQty} - ${pair.maxQty}`);
      console.log(`   Min Notional: ${pair.minNotional} USDT`);
      console.log(`   Tick Size: ${pair.tickSize}`);
      console.log(`   Step Size: ${pair.stepSize}`);
    } else {
      console.log('⚠️  BTCUSDT not found in database');
    }
    console.log('');
  } catch (error: any) {
    console.error(`❌ Query failed: ${error.message}\n`);
  }

  // 4. 获取实时价格（多个交易对）
  console.log('Test 4: Get Real-time Prices (Multiple Symbols)');
  try {
    const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'];
    const pricePromises = symbols.map(async (symbol) => {
      try {
        const price = await binanceService.getCurrentPrice(symbol);
        return { symbol, price, error: null };
      } catch (error: any) {
        return { symbol, price: null, error: error.message };
      }
    });

    const prices = await Promise.all(pricePromises);
    console.log('✅ Real-time Prices:');
    prices.forEach(({ symbol, price, error }) => {
      if (error) {
        console.log(`   ❌ ${symbol}: ${error}`);
      } else {
        console.log(`   - ${symbol}: $${price?.toLocaleString()}`);
      }
    });
    console.log('');
  } catch (error: any) {
    console.error(`❌ Get prices failed: ${error.message}\n`);
  }

  // 5. 获取 K 线数据
  console.log('Test 5: Get Klines Data');
  try {
    const klines = await binanceService.getKlines('BTCUSDT', '1h', 5);
    console.log(`✅ Retrieved ${klines.length} klines (1h interval):`);
    klines.forEach((kline, index) => {
      const date = new Date(kline.openTime).toLocaleString();
      console.log(`   [${index + 1}] ${date}: O=${kline.open} H=${kline.high} L=${kline.low} C=${kline.close} V=${kline.volume}`);
    });
    console.log('');
  } catch (error: any) {
    console.error(`❌ Get klines failed: ${error.message}\n`);
  }

  // 6. 统计数据
  console.log('Test 6: Get Market Statistics');
  try {
    const totalPairs = await prisma.tradingPair.count();
    const activePairs = await prisma.tradingPair.count({
      where: { isActive: true },
    });
    const lastSync = await prisma.tradingPair.findFirst({
      orderBy: { lastSyncAt: 'desc' },
      select: { lastSyncAt: true },
    });

    console.log('✅ Market Statistics:');
    console.log(`   Total Trading Pairs: ${totalPairs}`);
    console.log(`   Active Pairs: ${activePairs}`);
    console.log(`   Inactive Pairs: ${totalPairs - activePairs}`);
    console.log(`   Last Sync: ${lastSync?.lastSyncAt?.toLocaleString() || 'Never'}`);
    console.log('');
  } catch (error: any) {
    console.error(`❌ Get stats failed: ${error.message}\n`);
  }

  // 7. 测试搜索功能
  console.log('Test 7: Search Trading Pairs');
  try {
    const searchResults = await prisma.tradingPair.findMany({
      where: {
        OR: [
          { symbol: { contains: 'BTC' } },
          { baseAsset: { contains: 'BTC' } },
        ],
        isActive: true,
      },
      take: 5,
      select: { symbol: true, baseAsset: true, quoteAsset: true },
    });

    console.log(`✅ Search results for "BTC" (${searchResults.length} found):`);
    searchResults.forEach(pair => {
      console.log(`   - ${pair.symbol}: ${pair.baseAsset}/${pair.quoteAsset}`);
    });
    console.log('');
  } catch (error: any) {
    console.error(`❌ Search failed: ${error.message}\n`);
  }

  // 8. 测试分页
  console.log('Test 8: Pagination Test');
  try {
    const page = 1;
    const limit = 10;
    const total = await prisma.tradingPair.count({ where: { isActive: true } });
    const pairs = await prisma.tradingPair.findMany({
      where: { isActive: true },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { symbol: 'asc' },
      select: { symbol: true },
    });

    console.log(`✅ Pagination: Page ${page}/${Math.ceil(total / limit)}`);
    console.log(`   Showing ${pairs.length} of ${total} total pairs`);
    console.log(`   Symbols: ${pairs.map(p => p.symbol).join(', ')}`);
    console.log('');
  } catch (error: any) {
    console.error(`❌ Pagination failed: ${error.message}\n`);
  }

  console.log('🎉 All Market API tests completed!');
}

testMarketAPI()
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
