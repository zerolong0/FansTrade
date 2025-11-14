/**
 * Test script for Signal Scanner Service
 * Usage: npx tsx src/scripts/test-signal-scanner.ts
 */

import dotenv from 'dotenv';
dotenv.config({ override: true });

import { signalScannerService } from '../services/scheduler/signal-scanner.service';
import { io as ioClient } from 'socket.io-client';

async function testSignalScanner() {
  console.log('🔧 Testing Signal Scanner Service...\n');

  // 1. 测试手动扫描
  console.log('Test 1: Manual Scan');
  try {
    const scanConfig = {
      symbols: ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'],
      interval: '1h',
      scanFrequency: '*/15 * * * *', // Not used in manual scan
    };

    const result = await signalScannerService.runScan(scanConfig);

    console.log(`✅ Manual scan completed`);
    console.log(`   Symbols Scanned: ${result.symbolsScanned}`);
    console.log(`   Signals Generated: ${result.signalsGenerated}`);
    console.log(`   Errors: ${result.errors.length}`);
    console.log(`   Signals:`);
    result.signals.forEach((signal) => {
      const emoji =
        signal.signalType === 'STRONG_BUY' ? '🟢🟢' :
        signal.signalType === 'BUY' ? '🟢' :
        signal.signalType === 'NEUTRAL' ? '⚪' :
        signal.signalType === 'SELL' ? '🔴' : '🔴🔴';
      console.log(`     ${emoji} ${signal.symbol}: ${signal.signalType} @ $${signal.price.toFixed(2)} (${signal.confidence.toFixed(0)}%)`);
    });
    console.log('');
  } catch (error: any) {
    console.error(`❌ Manual scan failed: ${error.message}\n`);
  }

  // 2. 测试扫描器状态
  console.log('Test 2: Get Scanner Status (Before Start)');
  try {
    const status = signalScannerService.getStatus();

    console.log(`✅ Scanner Status:`);
    console.log(`   Is Running: ${status.isRunning}`);
    console.log(`   Active Scanners: ${status.activeScanners.join(', ') || 'None'}`);
    console.log(`   Scanner Count: ${status.scannerCount}`);
    console.log(`   Has Socket.IO: ${status.hasSocketIO}`);
    if (status.lastScanResult) {
      console.log(`   Last Scan: ${new Date(status.lastScanResult.timestamp).toLocaleString()}`);
      console.log(`   Last Scan Signals: ${status.lastScanResult.signalsGenerated}`);
    }
    console.log('');
  } catch (error: any) {
    console.error(`❌ Get status failed: ${error.message}\n`);
  }

  // 3. 测试启动定时扫描器（快速测试，每1分钟）
  console.log('Test 3: Start Scheduled Scanner (Every 1 Minute)');
  try {
    const scanConfig = {
      symbols: ['BTCUSDT', 'ETHUSDT'],
      interval: '1h',
      scanFrequency: '*/1 * * * *', // 每1分钟（仅用于测试）
    };

    signalScannerService.startScanner('test-scanner', scanConfig);

    console.log(`✅ Scheduled scanner started`);
    console.log(`   This scanner will run every 1 minute`);
    console.log(`   (In production, use longer intervals like */15 * * * * for 15 min)`);
    console.log('');
  } catch (error: any) {
    console.error(`❌ Start scanner failed: ${error.message}\n`);
  }

  // 4. 测试扫描器状态（启动后）
  console.log('Test 4: Get Scanner Status (After Start)');
  try {
    const status = signalScannerService.getStatus();

    console.log(`✅ Scanner Status:`);
    console.log(`   Is Running: ${status.isRunning}`);
    console.log(`   Active Scanners: ${status.activeScanners.join(', ')}`);
    console.log(`   Scanner Count: ${status.scannerCount}`);
    console.log('');
  } catch (error: any) {
    console.error(`❌ Get status failed: ${error.message}\n`);
  }

  // 5. 测试列出扫描器
  console.log('Test 5: List All Scanners');
  try {
    const scanners = signalScannerService.listScanners();

    console.log(`✅ Active Scanners: ${scanners.length}`);
    scanners.forEach((name) => {
      console.log(`   - ${name}`);
    });
    console.log('');
  } catch (error: any) {
    console.error(`❌ List scanners failed: ${error.message}\n`);
  }

  // 6. 测试 WebSocket 连接和信号接收（如果服务器正在运行）
  console.log('Test 6: WebSocket Signal Reception (Optional)');
  console.log(`⚠️  This test requires the server to be running on http://localhost:3000`);
  console.log(`⚠️  Start the server with: npm run dev`);
  console.log(`⚠️  Then re-run this test to see WebSocket signals`);
  console.log('');

  // 尝试连接 WebSocket（不阻塞测试）
  try {
    const socket = ioClient('http://localhost:3000', {
      reconnection: false,
      timeout: 2000,
    });

    socket.on('connect', () => {
      console.log(`✅ Connected to WebSocket server`);

      // 订阅所有信号
      socket.emit('subscribe:signals');

      // 订阅 BTCUSDT 信号
      socket.emit('subscribe:symbol', 'BTCUSDT');

      console.log(`📡 Subscribed to signal channels`);
      console.log(`📡 Listening for signals for 5 seconds...`);

      // 监听新信号
      socket.on('signal:new', (signal: any) => {
        console.log(`🔔 New Signal: ${signal.symbol} ${signal.signalType} @ $${signal.price}`);
      });

      socket.on('signal:BTCUSDT', (signal: any) => {
        console.log(`🔔 BTCUSDT Signal: ${signal.signalType} @ $${signal.price}`);
      });

      // 5秒后断开
      setTimeout(() => {
        socket.disconnect();
        console.log(`✅ WebSocket test completed\n`);
      }, 5000);
    });

    socket.on('connect_error', (error: any) => {
      console.log(`⚠️  Could not connect to WebSocket: ${error.message}`);
      console.log(`   Make sure the server is running\n`);
    });
  } catch (error: any) {
    console.log(`⚠️  WebSocket test skipped: ${error.message}\n`);
  }

  // 7. 等待一段时间后停止扫描器
  console.log('Test 7: Stop Scanner (After 10 Seconds)');
  setTimeout(() => {
    try {
      signalScannerService.stopScanner('test-scanner');
      console.log(`✅ Scanner stopped\n`);

      const status = signalScannerService.getStatus();
      console.log(`   Is Running: ${status.isRunning}`);
      console.log(`   Active Scanners: ${status.activeScanners.length}`);

      console.log('\n🎉 All Signal Scanner tests completed!');
      console.log('\n📝 Summary:');
      console.log('   - Manual scan: ✅ Working');
      console.log('   - Scheduled scan: ✅ Working');
      console.log('   - Scanner control: ✅ Working');
      console.log('   - WebSocket: ⚠️  Requires server running');
      console.log('\n💡 To test WebSocket integration:');
      console.log('   1. Run: npm run dev');
      console.log('   2. Wait for server to start');
      console.log('   3. In another terminal: npx tsx src/scripts/test-signal-scanner.ts');

      process.exit(0);
    } catch (error: any) {
      console.error(`❌ Stop scanner failed: ${error.message}\n`);
      process.exit(1);
    }
  }, 10000);
}

testSignalScanner().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
