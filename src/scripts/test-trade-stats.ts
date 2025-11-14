/**
 * Test script for Trade Statistics Service
 * Usage: npx tsx src/scripts/test-trade-stats.ts
 */

import dotenv from 'dotenv';
dotenv.config({ override: true });

import { orderExecutionService } from '../services/trading/order-execution.service';
import { tradeStatsService } from '../services/trading/trade-stats.service';
import { copyTradeService } from '../services/trading/copy-trade.service';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';
import { encrypt } from '../utils/encryption';

const prisma = new PrismaClient();

async function setupTestData() {
  console.log('🔧 Setting up test data...\n');

  const user = await prisma.user.upsert({
    where: { email: 'stats_test@test.com' },
    update: {},
    create: {
      username: 'stats_test_user',
      email: 'stats_test@test.com',
      passwordHash: await hash('password123', 10),
    },
  });

  const apiKey = await prisma.binanceApiKey.upsert({
    where: { id: 'test-stats-api-key' },
    update: {},
    create: {
      id: 'test-stats-api-key',
      userId: user.id,
      label: 'Test Stats API Key',
      apiKeyEncrypted: encrypt('test_api_key'),
      apiSecretEncrypted: encrypt('test_api_secret'),
      isActive: true,
    },
  });

  console.log('✅ Test data created:');
  console.log(`   User: ${user.username} (${user.id})`);
  console.log(`   API Key: ${apiKey.id}\n`);

  return { user, apiKey };
}

async function testTradeStats() {
  console.log('🔧 Testing Trade Statistics Service...\n');

  const { user } = await setupTestData();

  // Test 1: Execute several test trades
  console.log('Test 1: Execute Multiple Test Trades');
  const trades = [
    { symbol: 'BTCUSDT', side: 'BUY' as const, amount: 100 },
    { symbol: 'ETHUSDT', side: 'BUY' as const, amount: 200 },
    { symbol: 'BTCUSDT', side: 'SELL' as const, amount: 50 },
    { symbol: 'BNBUSDT', side: 'BUY' as const, amount: 150 },
  ];

  for (const trade of trades) {
    try {
      const result = await orderExecutionService.executeOrder({
        userId: user.id,
        symbol: trade.symbol,
        side: trade.side,
        amount: trade.amount,
        type: 'MARKET',
      });

      console.log(`✅ ${trade.side} ${trade.symbol} for $${trade.amount}: ${result.success ? 'Success' : 'Failed'}`);
    } catch (error: any) {
      console.error(`❌ Trade failed: ${error.message}`);
    }
  }
  console.log('');

  // Test 2: Get user trade statistics
  console.log('Test 2: Get User Trade Statistics');
  try {
    const stats = await tradeStatsService.getUserTradeStats(user.id);

    console.log(`✅ Trade Statistics:`);
    console.log(`   Total Trades: ${stats.totalTrades}`);
    console.log(`   Successful: ${stats.successfulTrades}`);
    console.log(`   Failed: ${stats.failedTrades}`);
    console.log(`   Total Volume: $${stats.totalVolume.toFixed(2)}`);
    console.log(`   Avg Trade Size: $${stats.avgTradeSize.toFixed(2)}`);
    console.log(`   Total Commission: $${stats.totalCommission.toFixed(4)}`);
    console.log(`   Win Rate: ${stats.winRate.toFixed(2)}% (from closed trades)`);
    console.log(`   Total P&L: $${stats.totalProfit.toFixed(2)} (from closed trades)`);
    console.log(`   Largest Win: $${stats.largestWin.toFixed(2)}`);
    console.log(`   Largest Loss: $${stats.largestLoss.toFixed(2)}`);
    console.log('');
  } catch (error: any) {
    console.error(`❌ Test 2 failed: ${error.message}\n`);
  }

  // Test 3: Get trade history
  console.log('Test 3: Get Trade History');
  try {
    const history = await tradeStatsService.getUserTradeHistory(user.id, {
      page: 1,
      limit: 10,
    });

    console.log(`✅ Trade History (Page 1):`);
    console.log(`   Total: ${history.pagination.total}`);
    console.log(`   Trades:`);

    history.trades.forEach((trade, index) => {
      console.log(
        `   ${index + 1}. ${trade.side} ${trade.symbol} - ${trade.status} - $${parseFloat(trade.executedValue).toFixed(2)} (${new Date(trade.createdAt).toLocaleString()})`
      );
    });
    console.log('');
  } catch (error: any) {
    console.error(`❌ Test 3 failed: ${error.message}\n`);
  }

  // Test 4: Get today's trade volume (for risk check)
  console.log('Test 4: Get Today Trade Volume');
  try {
    const todayVolume = await tradeStatsService.getTodayTradeVolume(user.id);
    console.log(`✅ Today's Trade Volume: $${todayVolume.toFixed(2)}\n`);
  } catch (error: any) {
    console.error(`❌ Test 4 failed: ${error.message}\n`);
  }

  // Test 5: Get copy trade stats (via copy trade service)
  console.log('Test 5: Get Copy Trade Stats (via Copy Trade Service)');
  try {
    const stats = await copyTradeService.getCopyTradeStats(user.id);

    console.log(`✅ Copy Trade Stats:`);
    console.log(`   Total Trades: ${stats.totalTrades}`);
    console.log(`   Successful: ${stats.successfulTrades}`);
    console.log(`   Failed: ${stats.failedTrades}`);
    console.log(`   Win Rate: ${stats.winRate.toFixed(2)}%`);
    console.log(`   Total P&L: $${stats.totalProfit.toFixed(2)}`);
    console.log(`   Avg Profit: $${stats.averageProfit.toFixed(2)}`);
    console.log('');
  } catch (error: any) {
    console.error(`❌ Test 5 failed: ${error.message}\n`);
  }

  // Test 6: Close a trade (simulate closing position)
  console.log('Test 6: Close Trade (Simulate P&L)');
  try {
    const history = await tradeStatsService.getUserTradeHistory(user.id, { limit: 1 });

    if (history.trades.length > 0) {
      const trade = history.trades[0];
      const closePrice = parseFloat(trade.executedPrice) * 1.05; // 5% profit
      const quantity = parseFloat(trade.executedQty);
      const realizedPnl =
        (closePrice - parseFloat(trade.executedPrice)) * quantity * (trade.side === 'BUY' ? 1 : -1);

      await tradeStatsService.updateTradeClose(trade.id, closePrice, realizedPnl);

      console.log(`✅ Trade closed:`);
      console.log(`   Trade ID: ${trade.id}`);
      console.log(`   Entry Price: $${parseFloat(trade.executedPrice).toFixed(2)}`);
      console.log(`   Close Price: $${closePrice.toFixed(2)}`);
      console.log(`   Realized P&L: $${realizedPnl.toFixed(2)}`);
      console.log('');
    } else {
      console.log(`⚠️  No trades to close\n`);
    }
  } catch (error: any) {
    console.error(`❌ Test 6 failed: ${error.message}\n`);
  }

  // Test 7: Get daily volume chart data
  console.log('Test 7: Get Daily Volume Chart Data (Last 30 days)');
  try {
    const dailyVolume = await tradeStatsService.getUserDailyVolume(user.id, 30);

    console.log(`✅ Daily Volume Data:`);
    console.log(`   Days with trades: ${dailyVolume.length}`);

    if (dailyVolume.length > 0) {
      console.log(`   Recent days:`);
      dailyVolume.slice(-5).forEach((day) => {
        console.log(`   ${day.date}: $${day.volume.toFixed(2)} (${day.trades} trades)`);
      });
    }
    console.log('');
  } catch (error: any) {
    console.error(`❌ Test 7 failed: ${error.message}\n`);
  }

  // Test 8: Get copy trade history (via copy trade service)
  console.log('Test 8: Get Copy Trade History (via Copy Trade Service)');
  try {
    const history = await copyTradeService.getUserCopyTradeHistory(user.id, {
      page: 1,
      limit: 5,
    });

    console.log(`✅ Copy Trade History:`);
    console.log(`   Total: ${history.pagination.total}`);
    console.log(`   Showing: ${history.trades.length} trades`);
    console.log('');
  } catch (error: any) {
    console.error(`❌ Test 8 failed: ${error.message}\n`);
  }

  console.log('🎉 All Trade Stats tests completed!');
}

testTradeStats()
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
