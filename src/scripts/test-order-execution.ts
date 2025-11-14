/**
 * Test script for Order Execution Service
 * Usage: npx tsx src/scripts/test-order-execution.ts
 */

import dotenv from 'dotenv';
dotenv.config({ override: true });

import { orderExecutionService } from '../services/trading/order-execution.service';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';
import { encrypt } from '../utils/encryption';

const prisma = new PrismaClient();

async function setupTestData() {
  console.log('🔧 Setting up test data...\n');

  // 1. 创建测试用户
  const user = await prisma.user.upsert({
    where: { email: 'order_test@test.com' },
    update: {},
    create: {
      username: 'order_test_user',
      email: 'order_test@test.com',
      passwordHash: await hash('password123', 10),
    },
  });

  // 2. 创建 Binance API Key（模拟加密）
  const apiKey = await prisma.binanceApiKey.upsert({
    where: { id: 'test-order-api-key' },
    update: {},
    create: {
      id: 'test-order-api-key',
      userId: user.id,
      label: 'Test Order API Key',
      apiKeyEncrypted: encrypt('test_api_key'),
      apiSecretEncrypted: encrypt('test_api_secret'),
      isActive: true,
    },
  });

  console.log('✅ Test data created:');
  console.log(`   User: ${user.username} (${user.id})`);
  console.log(`   API Key: ${apiKey.id}`);
  console.log('');

  return { user, apiKey };
}

async function testOrderExecution() {
  console.log('🔧 Testing Order Execution Service...\n');

  const { user } = await setupTestData();

  // Test 1: 风控检查 - 余额检查
  console.log('Test 1: Risk Checks - Balance Verification');
  try {
    const riskCheck = await orderExecutionService.performRiskChecks(
      user.id,
      'BTCUSDT',
      100 // $100 USDT
    );

    console.log(`\n✅ Risk check result:`);
    console.log(`   Passed: ${riskCheck.passed}`);
    console.log(`   Balance Check: ${riskCheck.checks.balance.passed}`);
    console.log(`     Available: $${riskCheck.checks.balance.available.toFixed(2)}`);
    console.log(`     Required: $${riskCheck.checks.balance.required.toFixed(2)}`);
    console.log(`   Position Size: ${riskCheck.checks.positionSize.passed}`);
    console.log(`     Current: $${riskCheck.checks.positionSize.current}`);
    console.log(`     Max: $${riskCheck.checks.positionSize.max}`);
    console.log(`   Daily Limit: ${riskCheck.checks.dailyLimit.passed}`);
    console.log(`     Used: $${riskCheck.checks.dailyLimit.used}`);
    console.log(`     Limit: $${riskCheck.checks.dailyLimit.limit}`);
    console.log('');
  } catch (error: any) {
    console.error(`❌ Test 1 failed: ${error.message}\n`);
  }

  // Test 2: 风控检查 - 超过最大单笔金额
  console.log('Test 2: Risk Checks - Exceed Max Position Size');
  try {
    const riskCheck = await orderExecutionService.performRiskChecks(
      user.id,
      'BTCUSDT',
      15000 // $15,000 USDT (超过默认 $10,000 限制)
    );

    console.log(`\n   Risk check result:`);
    console.log(`   Passed: ${riskCheck.passed}`);
    console.log(`   Reason: ${riskCheck.reason || 'N/A'}`);
    console.log('');
  } catch (error: any) {
    console.error(`❌ Test 2 failed: ${error.message}\n`);
  }

  // Test 3: 获取当前市场价
  console.log('Test 3: Get Current Market Price');
  try {
    const price = await orderExecutionService.getCurrentPrice('BTCUSDT');
    console.log(`✅ Current BTC price: $${price.toFixed(2)}\n`);
  } catch (error: any) {
    console.error(`❌ Test 3 failed: ${error.message}\n`);
  }

  // Test 4: 计算购买数量
  console.log('Test 4: Calculate Order Quantity');
  try {
    const amount = 100; // $100 USDT
    const price = 43000; // BTC price

    const quantity = orderExecutionService.calculateQuantity(amount, price, 'BTCUSDT');
    console.log(`✅ Quantity calculation:`);
    console.log(`   Amount: $${amount} USDT`);
    console.log(`   Price: $${price.toFixed(2)}`);
    console.log(`   Quantity: ${quantity} BTC\n`);
  } catch (error: any) {
    console.error(`❌ Test 4 failed: ${error.message}\n`);
  }

  // Test 5: 执行市价买单（Mock 模式）
  console.log('Test 5: Execute Market Buy Order (Mock Mode)');
  try {
    const orderResult = await orderExecutionService.executeOrder({
      userId: user.id,
      symbol: 'BTCUSDT',
      side: 'BUY',
      amount: 100,
      type: 'MARKET',
    });

    console.log(`\n✅ Order execution result:`);
    console.log(`   Success: ${orderResult.success}`);
    if (orderResult.success) {
      console.log(`   Order ID: ${orderResult.orderId}`);
      console.log(`   Executed Qty: ${orderResult.executedQty}`);
      console.log(`   Executed Price: $${orderResult.executedPrice?.toFixed(2)}`);
      console.log(`   Status: ${orderResult.status}`);
    } else {
      console.log(`   Error: ${orderResult.error}`);
    }
    console.log('');
  } catch (error: any) {
    console.error(`❌ Test 5 failed: ${error.message}\n`);
  }

  // Test 6: 执行限价卖单（Mock 模式）
  console.log('Test 6: Execute Limit Sell Order (Mock Mode)');
  try {
    const orderResult = await orderExecutionService.executeOrder({
      userId: user.id,
      symbol: 'ETHUSDT',
      side: 'SELL',
      amount: 200,
      type: 'LIMIT',
      price: 3300,
    });

    console.log(`\n✅ Order execution result:`);
    console.log(`   Success: ${orderResult.success}`);
    if (orderResult.success) {
      console.log(`   Order ID: ${orderResult.orderId}`);
      console.log(`   Executed Qty: ${orderResult.executedQty}`);
      console.log(`   Executed Price: $${orderResult.executedPrice?.toFixed(2)}`);
      console.log(`   Status: ${orderResult.status}`);
    } else {
      console.log(`   Error: ${orderResult.error}`);
    }
    console.log('');
  } catch (error: any) {
    console.error(`❌ Test 6 failed: ${error.message}\n`);
  }

  // Test 7: 查询订单状态（Mock 模式）
  console.log('Test 7: Query Order Status (Mock Mode)');
  try {
    const orderStatus = await orderExecutionService.getOrderStatus(
      user.id,
      '123456',
      'BTCUSDT'
    );

    console.log(`✅ Order status:`);
    console.log(`   Order ID: ${orderStatus.orderId}`);
    console.log(`   Symbol: ${orderStatus.symbol}`);
    console.log(`   Status: ${orderStatus.status}`);
    console.log(`   Side: ${orderStatus.side}`);
    console.log(`   Type: ${orderStatus.type}`);
    console.log(`   Executed Qty: ${orderStatus.executedQty}`);
    console.log('');
  } catch (error: any) {
    console.error(`❌ Test 7 failed: ${error.message}\n`);
  }

  // Test 8: 取消订单（Mock 模式）
  console.log('Test 8: Cancel Order (Mock Mode)');
  try {
    const result = await orderExecutionService.cancelOrder(
      user.id,
      '123456',
      'BTCUSDT'
    );

    console.log(`✅ Order cancelled:`);
    console.log(`   Order ID: ${result.orderId}`);
    console.log(`   Status: ${result.status}`);
    console.log('');
  } catch (error: any) {
    console.error(`❌ Test 8 failed: ${error.message}\n`);
  }

  // Test 9: 余额不足的情况
  console.log('Test 9: Order Execution with Insufficient Balance');
  try {
    const orderResult = await orderExecutionService.executeOrder({
      userId: user.id,
      symbol: 'BTCUSDT',
      side: 'BUY',
      amount: 1000000, // $1,000,000 USDT (超过余额)
      type: 'MARKET',
    });

    console.log(`\n   Order execution result:`);
    console.log(`   Success: ${orderResult.success}`);
    console.log(`   Error: ${orderResult.error || 'N/A'}`);
    console.log('');
  } catch (error: any) {
    console.error(`❌ Test 9 failed: ${error.message}\n`);
  }

  console.log('🎉 All Order Execution tests completed!');
}

testOrderExecution()
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
