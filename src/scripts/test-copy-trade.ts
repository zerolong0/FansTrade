/**
 * Test script for Copy Trade Service
 * Usage: npx tsx src/scripts/test-copy-trade.ts
 */

import dotenv from 'dotenv';
dotenv.config({ override: true });

import { copyTradeService } from '../services/trading/copy-trade.service';
import { signalGeneratorService } from '../services/signals/signal-generator.service';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function setupTestData() {
  console.log('🔧 Setting up test data...\n');

  // 1. 创建测试用户（trader）
  const trader = await prisma.user.upsert({
    where: { email: 'trader@test.com' },
    update: {},
    create: {
      username: 'test_trader',
      email: 'trader@test.com',
      passwordHash: await hash('password123', 10),
    },
  });

  // 2. 创建测试用户（follower）
  const follower = await prisma.user.upsert({
    where: { email: 'follower@test.com' },
    update: {},
    create: {
      username: 'test_follower',
      email: 'follower@test.com',
      passwordHash: await hash('password123', 10),
    },
  });

  // 3. 创建交易策略
  const strategy = await prisma.tradingStrategy.upsert({
    where: { traderId: trader.id },
    update: {},
    create: {
      traderId: trader.id,
      totalTrades: 100,
      winRate: 0.65,
      avgHoldingDays: 3.5,
      maxDrawdown: 0.15,
      annualizedReturn: 0.25,
      sharpeRatio: 1.8,
      tradingStyle: 'swing',
      riskLevel: 'moderate',
      description: 'Test trading strategy',
      suitableFor: 'Swing traders',
      topSymbols: ['BTCUSDT', 'ETHUSDT'],
    },
  });

  // 4. 创建 Follow 关系（自动跟买）
  const followAuto = await prisma.follow.upsert({
    where: {
      followerId_traderId: {
        followerId: follower.id,
        traderId: trader.id,
      },
    },
    update: {},
    create: {
      followerId: follower.id,
      traderId: trader.id,
      config: {
        autoExecute: true,
        symbolsFilter: ['BTCUSDT', 'ETHUSDT'],
        maxAmountPerTrade: 1000,
        minConfidence: 70,
        signalTypeFilter: ['STRONG_BUY', 'BUY'],
      },
    },
  });

  // 5. 创建 Binance API Key
  const apiKey = await prisma.binanceApiKey.upsert({
    where: { id: 'test-api-key-id' },
    update: {},
    create: {
      id: 'test-api-key-id',
      userId: follower.id,
      label: 'Test API Key',
      apiKeyEncrypted: 'encrypted_key',
      apiSecretEncrypted: 'encrypted_secret',
      isActive: true,
    },
  });

  console.log('✅ Test data created:');
  console.log(`   Trader: ${trader.username} (${trader.id})`);
  console.log(`   Follower: ${follower.username} (${follower.id})`);
  console.log(`   Strategy: ${strategy.id}`);
  console.log(`   Follow: Auto-execute enabled`);
  console.log('');

  return { trader, follower, strategy, followAuto, apiKey };
}

async function testCopyTrade() {
  console.log('🔧 Testing Copy Trade Service...\n');

  const { trader, follower, strategy } = await setupTestData();

  // Test 1: 生成信号并测试跟买决策
  console.log('Test 1: Generate Signal and Evaluate Copy Trade Decision');
  try {
    // 生成一个符合条件的信号
    const signalResult = await signalGeneratorService.generateSignal({
      symbol: 'BTCUSDT',
      interval: '1h',
      limit: 100,
      strategyId: strategy.id,
    });

    console.log(`✅ Signal generated:`);
    console.log(`   ID: ${signalResult.signal.id}`);
    console.log(`   Symbol: ${signalResult.signal.symbol}`);
    console.log(`   Type: ${signalResult.signal.signalType}`);
    console.log(`   Confidence: ${(signalResult.signal.confidence * 100).toFixed(1)}%`);

    // 获取跟买配置
    const followConfig = await copyTradeService.getFollowConfig(follower.id, trader.id);
    console.log(`\n   Follow Config:`);
    console.log(`   - Auto Execute: ${followConfig.autoExecute}`);
    console.log(`   - Symbols Filter: ${followConfig.symbolsFilter?.join(', ')}`);
    console.log(`   - Min Confidence: ${followConfig.minConfidence}%`);
    console.log(`   - Signal Type Filter: ${followConfig.signalTypeFilter?.join(', ')}`);

    // 评估跟买决策
    const decision = copyTradeService.evaluateCopyTradeDecision(
      signalResult.signal,
      followConfig
    );

    console.log(`\n   Copy Trade Decision:`);
    console.log(`   - Should Copy: ${decision.shouldCopy ? '✅' : '❌'}`);
    console.log(`   - Reason: ${decision.reason}`);
    if (decision.estimatedAmount) {
      console.log(`   - Estimated Amount: $${decision.estimatedAmount}`);
    }
    console.log('');
  } catch (error: any) {
    console.error(`❌ Test 1 failed: ${error.message}\n`);
  }

  // Test 2: 测试手动触发跟买
  console.log('Test 2: Manual Copy Trade Execution');
  try {
    // 生成另一个信号
    const signalResult = await signalGeneratorService.generateSignal({
      symbol: 'ETHUSDT',
      interval: '1h',
      limit: 100,
      strategyId: strategy.id,
    });

    // 手动执行跟买
    const copyResult = await copyTradeService.executeCopyTrade({
      userId: follower.id,
      signalId: signalResult.signal.id,
      amount: 500,
      mode: 'manual',
    });

    console.log(`✅ Copy trade executed:`);
    console.log(`   Success: ${copyResult.success}`);
    console.log(`   Message: ${copyResult.message}`);
    console.log('');
  } catch (error: any) {
    console.error(`❌ Test 2 failed: ${error.message}\n`);
  }

  // Test 3: 测试自动跟买流程
  console.log('Test 3: Automatic Copy Trade Flow');
  try {
    // 生成信号
    const signalResult = await signalGeneratorService.generateSignal({
      symbol: 'BTCUSDT',
      interval: '1h',
      limit: 100,
      strategyId: strategy.id,
    });

    console.log(`✅ Signal generated: ${signalResult.signal.id}`);

    // 触发跟买检查（模拟扫描器行为）
    await copyTradeService.handleNewSignal(signalResult.signal.id);

    console.log(`✅ Copy trade check completed\n`);
  } catch (error: any) {
    console.error(`❌ Test 3 failed: ${error.message}\n`);
  }

  // Test 4: 测试配置更新
  console.log('Test 4: Update Follow Config');
  try {
    const updatedFollow = await copyTradeService.updateFollowConfig(
      follower.id,
      trader.id,
      {
        autoExecute: false, // 关闭自动跟买
        minConfidence: 80, // 提高最小置信度
      }
    );

    const newConfig = updatedFollow.config as any;
    console.log(`✅ Config updated:`);
    console.log(`   - Auto Execute: ${newConfig.autoExecute}`);
    console.log(`   - Min Confidence: ${newConfig.minConfidence}%`);
    console.log('');
  } catch (error: any) {
    console.error(`❌ Test 4 failed: ${error.message}\n`);
  }

  // Test 5: 测试过滤器（不符合条件的信号）
  console.log('Test 5: Test Signal Filters');
  try {
    // 生成一个不符合条件的信号（SELL 类型）
    const signal = await prisma.binanceTradingSignal.create({
      data: {
        symbol: 'BNBUSDT', // 不在过滤列表中
        signalType: 'SELL', // 不在信号类型过滤中
        price: '620.00',
        confidence: 0.65, // 低于最小置信度（现在是 80%）
        indicators: {},
        status: 'PENDING',
        tradingPairId: (await prisma.tradingPair.findFirst({ where: { symbol: 'BNBUSDT' } }))!.id,
        strategyId: strategy.id,
      },
    });

    const followConfig = await copyTradeService.getFollowConfig(follower.id, trader.id);
    const decision = copyTradeService.evaluateCopyTradeDecision(signal, followConfig);

    console.log(`✅ Signal: ${signal.symbol} ${signal.signalType} (${(signal.confidence * 100).toFixed(0)}%)`);
    console.log(`   Should Copy: ${decision.shouldCopy ? '✅' : '❌'}`);
    console.log(`   Reason: ${decision.reason}`);
    console.log('');
  } catch (error: any) {
    console.error(`❌ Test 5 failed: ${error.message}\n`);
  }

  // Test 6: 测试统计功能（占位符）
  console.log('Test 6: Get Copy Trade Stats (Placeholder)');
  try {
    const stats = await copyTradeService.getCopyTradeStats(follower.id);

    console.log(`✅ Stats retrieved (Phase 4.3 will implement):`);
    console.log(`   Total Trades: ${stats.totalTrades}`);
    console.log(`   Win Rate: ${stats.winRate}%`);
    console.log(`   Total Profit: $${stats.totalProfit}`);
    console.log('');
  } catch (error: any) {
    console.error(`❌ Test 6 failed: ${error.message}\n`);
  }

  console.log('🎉 All Copy Trade tests completed!');
}

testCopyTrade()
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
