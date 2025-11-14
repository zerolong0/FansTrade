/**
 * Test script for Technical Indicators
 * Usage: npx tsx src/scripts/test-indicators.ts
 */

import dotenv from 'dotenv';
dotenv.config({ override: true });

import { technicalIndicatorsService } from '../services/indicators/technical-indicators.service';

async function testIndicators() {
  console.log('🔧 Testing Technical Indicators Service...\n');

  const symbol = 'BTCUSDT';
  const interval = '1h';
  const limit = 100;

  // 1. 测试计算所有指标
  console.log(`Test 1: Calculate All Indicators for ${symbol}`);
  try {
    const indicators = await technicalIndicatorsService.calculateAllIndicators(
      symbol,
      interval,
      limit
    );

    console.log(`✅ Indicators calculated successfully`);
    console.log(`   Symbol: ${indicators.symbol}`);
    console.log(`   Interval: ${indicators.interval}`);
    console.log(`   MACD data points: ${indicators.macd.length}`);
    console.log(`   RSI data points: ${indicators.rsi.length}`);
    console.log(`   Bollinger Bands data points: ${indicators.bollingerBands.length}`);

    // 显示最新指标值
    const latestMACD = indicators.macd[indicators.macd.length - 1];
    const latestRSI = indicators.rsi[indicators.rsi.length - 1];
    const latestBB = indicators.bollingerBands[indicators.bollingerBands.length - 1];

    console.log(`\n   📊 Latest Indicators:`);
    console.log(`   MACD:`);
    console.log(`     - MACD: ${latestMACD.macd?.toFixed(2) || 'N/A'}`);
    console.log(`     - Signal: ${latestMACD.signal?.toFixed(2) || 'N/A'}`);
    console.log(`     - Histogram: ${latestMACD.histogram?.toFixed(2) || 'N/A'}`);
    console.log(`   RSI:`);
    console.log(`     - Value: ${latestRSI.rsi?.toFixed(2) || 'N/A'}`);
    console.log(`   Bollinger Bands:`);
    console.log(`     - Upper: $${latestBB.upper?.toFixed(2) || 'N/A'}`);
    console.log(`     - Middle: $${latestBB.middle?.toFixed(2) || 'N/A'}`);
    console.log(`     - Lower: $${latestBB.lower?.toFixed(2) || 'N/A'}`);
    console.log(`     - Bandwidth: ${latestBB.bandwidth?.toFixed(4) || 'N/A'}`);
    console.log('');
  } catch (error: any) {
    console.error(`❌ Calculate indicators failed: ${error.message}\n`);
  }

  // 2. 测试交易信号分析
  console.log(`Test 2: Analyze Trading Signal for ${symbol}`);
  try {
    const analysis = await technicalIndicatorsService.analyzeSignal(symbol, interval, limit);

    console.log(`✅ Signal analysis completed`);
    console.log(`   Symbol: ${analysis.symbol}`);
    console.log(`   Current Price: $${analysis.currentPrice.toLocaleString()}`);
    console.log(`   Timestamp: ${new Date(analysis.timestamp).toLocaleString()}`);

    console.log(`\n   📈 Indicator Analysis:`);

    // MACD 分析
    console.log(`   MACD:`);
    console.log(`     - Value: ${analysis.indicators.macd.value?.toFixed(2) || 'N/A'}`);
    console.log(`     - Signal: ${analysis.indicators.macd.signal?.toFixed(2) || 'N/A'}`);
    console.log(`     - Histogram: ${analysis.indicators.macd.histogram?.toFixed(2) || 'N/A'}`);
    console.log(`     - Trend: ${analysis.indicators.macd.trend.toUpperCase()}`);

    if (analysis.indicators.macd.crossover !== 'none') {
      const emoji = analysis.indicators.macd.crossover === 'golden' ? '🌟' : '💀';
      console.log(`     - Crossover: ${emoji} ${analysis.indicators.macd.crossover.toUpperCase()}`);
    }

    // RSI 分析
    console.log(`   RSI:`);
    console.log(`     - Value: ${analysis.indicators.rsi.value?.toFixed(2) || 'N/A'}`);
    const rsiEmoji =
      analysis.indicators.rsi.condition === 'overbought' ? '🔥' :
      analysis.indicators.rsi.condition === 'oversold' ? '❄️' : '➖';
    console.log(`     - Condition: ${rsiEmoji} ${analysis.indicators.rsi.condition.toUpperCase()}`);

    // Bollinger Bands 分析
    console.log(`   Bollinger Bands:`);
    console.log(`     - Upper: $${analysis.indicators.bollingerBands.upper?.toFixed(2) || 'N/A'}`);
    console.log(`     - Middle: $${analysis.indicators.bollingerBands.middle?.toFixed(2) || 'N/A'}`);
    console.log(`     - Lower: $${analysis.indicators.bollingerBands.lower?.toFixed(2) || 'N/A'}`);
    console.log(`     - Position: ${analysis.indicators.bollingerBands.position.toUpperCase()}`);
    console.log(`     - Bandwidth: ${analysis.indicators.bollingerBands.bandwidth?.toFixed(4) || 'N/A'}`);

    if (analysis.indicators.bollingerBands.squeeze) {
      console.log(`     - ⚠️  Bollinger Bands SQUEEZE (即将突破)`);
    }

    // 交易信号
    console.log(`\n   🎯 Trading Signal:`);
    const signalEmoji =
      analysis.signal === 'strong_buy' ? '🟢🟢' :
      analysis.signal === 'buy' ? '🟢' :
      analysis.signal === 'neutral' ? '⚪' :
      analysis.signal === 'sell' ? '🔴' : '🔴🔴';
    console.log(`     - Signal: ${signalEmoji} ${analysis.signal.toUpperCase()}`);
    console.log(`     - Confidence: ${analysis.confidence.toFixed(1)}%`);
    console.log(`     - Reasons:`);
    analysis.reasons.forEach((reason, index) => {
      console.log(`       ${index + 1}. ${reason}`);
    });
    console.log('');
  } catch (error: any) {
    console.error(`❌ Signal analysis failed: ${error.message}\n`);
  }

  // 3. 测试多个交易对
  console.log(`Test 3: Analyze Multiple Symbols`);
  const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'];

  for (const sym of symbols) {
    try {
      const analysis = await technicalIndicatorsService.analyzeSignal(sym, '1h', 50);

      const signalEmoji =
        analysis.signal === 'strong_buy' ? '🟢🟢' :
        analysis.signal === 'buy' ? '🟢' :
        analysis.signal === 'neutral' ? '⚪' :
        analysis.signal === 'sell' ? '🔴' : '🔴🔴';

      console.log(`   ${sym}:`);
      console.log(`     Price: $${analysis.currentPrice.toLocaleString()}`);
      console.log(`     Signal: ${signalEmoji} ${analysis.signal.toUpperCase()} (${analysis.confidence.toFixed(0)}%)`);
      console.log(`     MACD: ${analysis.indicators.macd.trend} (${analysis.indicators.macd.crossover})`);
      console.log(`     RSI: ${analysis.indicators.rsi.value?.toFixed(1)} (${analysis.indicators.rsi.condition})`);
      console.log(`     BB Position: ${analysis.indicators.bollingerBands.position}`);
      console.log('');
    } catch (error: any) {
      console.error(`   ❌ ${sym}: ${error.message}\n`);
    }
  }

  // 4. 测试历史信号回顾（最近10个数据点）
  console.log(`Test 4: Historical Signal Review (Last 10 periods)`);
  try {
    const indicators = await technicalIndicatorsService.calculateAllIndicators('BTCUSDT', '1h', 100);

    console.log(`   Recent MACD Histogram trend:`);
    const recentMACD = indicators.macd.slice(-10);
    recentMACD.forEach((macd, index) => {
      const trend = macd.histogram && macd.histogram > 0 ? '📈 Bullish' :
                    macd.histogram && macd.histogram < 0 ? '📉 Bearish' : '➖ Neutral';
      console.log(`     [${index + 1}] ${trend}: ${macd.histogram?.toFixed(2) || 'N/A'}`);
    });

    console.log(`\n   Recent RSI trend:`);
    const recentRSI = indicators.rsi.slice(-10);
    recentRSI.forEach((rsi, index) => {
      const condition = rsi.rsi && rsi.rsi > 70 ? '🔥 Overbought' :
                        rsi.rsi && rsi.rsi < 30 ? '❄️  Oversold' : '➖ Neutral';
      console.log(`     [${index + 1}] ${condition}: ${rsi.rsi?.toFixed(1) || 'N/A'}`);
    });
    console.log('');
  } catch (error: any) {
    console.error(`   ❌ Historical review failed: ${error.message}\n`);
  }

  console.log('🎉 All Technical Indicators tests completed!');
}

testIndicators().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
