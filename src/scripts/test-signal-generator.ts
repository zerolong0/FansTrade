/**
 * Test script for Signal Generator Service
 * Usage: npx tsx src/scripts/test-signal-generator.ts
 */

import dotenv from 'dotenv';
dotenv.config({ override: true });

import { signalGeneratorService } from '../services/signals/signal-generator.service';

async function testSignalGenerator() {
  console.log('🔧 Testing Signal Generator Service...\n');

  // 1. 测试单个信号生成
  console.log('Test 1: Generate Signal for BTCUSDT');
  try {
    const result = await signalGeneratorService.generateSignal({
      symbol: 'BTCUSDT',
      interval: '1h',
      limit: 100,
    });

    console.log(`✅ Signal generated successfully`);
    console.log(`   Signal ID: ${result.signal.id}`);
    console.log(`   Symbol: ${result.signal.symbol}`);
    console.log(`   Type: ${result.signal.signalType}`);
    console.log(`   Price: $${parseFloat(result.signal.price).toLocaleString()}`);
    console.log(`   Confidence: ${(result.signal.confidence * 100).toFixed(1)}%`);
    console.log(`   Status: ${result.signal.status}`);
    console.log(`   Created: ${result.signal.createdAt.toLocaleString()}`);

    // 显示分析原因
    const indicators = result.signal.indicators as any;
    if (indicators.reasons && Array.isArray(indicators.reasons)) {
      console.log(`   Reasons:`);
      indicators.reasons.forEach((reason: string, index: number) => {
        console.log(`     ${index + 1}. ${reason}`);
      });
    }
    console.log('');
  } catch (error: any) {
    console.error(`❌ Generate signal failed: ${error.message}\n`);
  }

  // 2. 测试批量信号生成
  console.log('Test 2: Generate Signals for Multiple Symbols');
  try {
    const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'];
    const results = await signalGeneratorService.generateSignalsForMultipleSymbols(
      symbols,
      '1h',
      100
    );

    console.log(`✅ Generated ${results.length} signals`);
    results.forEach((result) => {
      const signalEmoji =
        result.signal.signalType === 'STRONG_BUY' ? '🟢🟢' :
        result.signal.signalType === 'BUY' ? '🟢' :
        result.signal.signalType === 'NEUTRAL' ? '⚪' :
        result.signal.signalType === 'SELL' ? '🔴' : '🔴🔴';

      console.log(`   ${signalEmoji} ${result.signal.symbol}: ${result.signal.signalType} (${(result.signal.confidence * 100).toFixed(0)}%)`);
    });
    console.log('');
  } catch (error: any) {
    console.error(`❌ Batch generation failed: ${error.message}\n`);
  }

  // 3. 测试查询信号
  console.log('Test 3: Query Recent Signals');
  try {
    const queryResult = await signalGeneratorService.querySignals({
      page: 1,
      limit: 10,
    });

    console.log(`✅ Found ${queryResult.pagination.total} total signals`);
    console.log(`   Showing page ${queryResult.pagination.page}/${queryResult.pagination.totalPages}`);
    console.log(`   Recent signals:`);

    queryResult.signals.forEach((signal, index) => {
      const signalEmoji =
        signal.signalType === 'STRONG_BUY' ? '🟢🟢' :
        signal.signalType === 'BUY' ? '🟢' :
        signal.signalType === 'NEUTRAL' ? '⚪' :
        signal.signalType === 'SELL' ? '🔴' : '🔴🔴';

      console.log(`     [${index + 1}] ${signalEmoji} ${signal.symbol}: ${signal.signalType} @ $${parseFloat(signal.price).toFixed(2)} (${signal.status})`);
    });
    console.log('');
  } catch (error: any) {
    console.error(`❌ Query failed: ${error.message}\n`);
  }

  // 4. 测试按交易对过滤
  console.log('Test 4: Query Signals for BTCUSDT');
  try {
    const btcSignals = await signalGeneratorService.querySignals({
      symbol: 'BTCUSDT',
      page: 1,
      limit: 5,
    });

    console.log(`✅ Found ${btcSignals.pagination.total} BTCUSDT signals`);
    btcSignals.signals.forEach((signal, index) => {
      console.log(`     [${index + 1}] ${signal.signalType} @ $${parseFloat(signal.price).toFixed(2)} - ${signal.createdAt.toLocaleString()}`);
    });
    console.log('');
  } catch (error: any) {
    console.error(`❌ Query BTCUSDT failed: ${error.message}\n`);
  }

  // 5. 测试按信号类型过滤
  console.log('Test 5: Query BUY and STRONG_BUY Signals');
  try {
    const [buySignals, strongBuySignals] = await Promise.all([
      signalGeneratorService.querySignals({ signalType: 'BUY', limit: 5 }),
      signalGeneratorService.querySignals({ signalType: 'STRONG_BUY', limit: 5 }),
    ]);

    console.log(`✅ Found ${buySignals.pagination.total} BUY signals`);
    console.log(`✅ Found ${strongBuySignals.pagination.total} STRONG_BUY signals`);
    console.log('');
  } catch (error: any) {
    console.error(`❌ Query by type failed: ${error.message}\n`);
  }

  // 6. 测试信号统计
  console.log('Test 6: Get Signal Statistics');
  try {
    const stats = await signalGeneratorService.getSignalStatistics({});

    console.log(`✅ Signal Statistics:`);
    console.log(`   Total Signals: ${stats.total}`);
    console.log(`   By Signal Type:`);
    console.log(`     - Strong Buy: ${stats.bySignalType.strongBuy}`);
    console.log(`     - Buy: ${stats.bySignalType.buy}`);
    console.log(`     - Neutral: ${stats.bySignalType.neutral}`);
    console.log(`     - Sell: ${stats.bySignalType.sell}`);
    console.log(`     - Strong Sell: ${stats.bySignalType.strongSell}`);
    console.log(`   By Status:`);
    console.log(`     - Pending: ${stats.byStatus.pending}`);
    console.log(`     - Executed: ${stats.byStatus.executed}`);
    console.log(`     - Expired: ${stats.byStatus.expired}`);
    console.log(`     - Cancelled: ${stats.byStatus.cancelled}`);
    console.log(`   Average Confidence: ${(stats.avgConfidence * 100).toFixed(1)}%`);
    console.log('');
  } catch (error: any) {
    console.error(`❌ Statistics failed: ${error.message}\n`);
  }

  // 7. 测试获取单个信号详情
  console.log('Test 7: Get Signal Details');
  try {
    // 先获取最新的信号ID
    const recentSignals = await signalGeneratorService.querySignals({
      page: 1,
      limit: 1,
    });

    if (recentSignals.signals.length > 0) {
      const signalId = recentSignals.signals[0].id;
      const signal = await signalGeneratorService.getSignalById(signalId);

      console.log(`✅ Signal Details:`);
      console.log(`   ID: ${signal.id}`);
      console.log(`   Symbol: ${signal.symbol} (${signal.tradingPair.baseAsset}/${signal.tradingPair.quoteAsset})`);
      console.log(`   Type: ${signal.signalType}`);
      console.log(`   Price: $${parseFloat(signal.price).toFixed(2)}`);
      console.log(`   Confidence: ${(signal.confidence * 100).toFixed(1)}%`);
      console.log(`   Status: ${signal.status}`);

      const indicators = signal.indicators as any;
      console.log(`   Indicators:`);
      console.log(`     MACD: ${indicators.macd.value?.toFixed(2) || 'N/A'} (${indicators.macd.trend})`);
      console.log(`     RSI: ${indicators.rsi.value?.toFixed(1) || 'N/A'} (${indicators.rsi.condition})`);
      console.log(`     BB Position: ${indicators.bollingerBands.position}`);

      console.log('');
    } else {
      console.log('⚠️  No signals found to display details\n');
    }
  } catch (error: any) {
    console.error(`❌ Get signal details failed: ${error.message}\n`);
  }

  // 8. 测试更新信号状态
  console.log('Test 8: Update Signal Status');
  try {
    const recentSignals = await signalGeneratorService.querySignals({
      status: 'PENDING',
      page: 1,
      limit: 1,
    });

    if (recentSignals.signals.length > 0) {
      const signalId = recentSignals.signals[0].id;
      const originalStatus = recentSignals.signals[0].status;

      // 更新为 CANCELLED
      const updatedSignal = await signalGeneratorService.updateSignalStatus(
        signalId,
        'CANCELLED'
      );

      console.log(`✅ Signal status updated:`);
      console.log(`   ID: ${signalId}`);
      console.log(`   Status: ${originalStatus} → ${updatedSignal.status}`);
      console.log('');
    } else {
      console.log('⚠️  No PENDING signals found to update\n');
    }
  } catch (error: any) {
    console.error(`❌ Update status failed: ${error.message}\n`);
  }

  // 9. 测试清理过期信号
  console.log('Test 9: Cleanup Expired Signals');
  try {
    const cleanedCount = await signalGeneratorService.cleanupExpiredSignals();

    console.log(`✅ Cleaned up ${cleanedCount} expired signals`);
    console.log('');
  } catch (error: any) {
    console.error(`❌ Cleanup failed: ${error.message}\n`);
  }

  console.log('🎉 All Signal Generator tests completed!');
}

testSignalGenerator()
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    process.exit(0);
  });
