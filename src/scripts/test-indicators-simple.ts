/**
 * Simple test for technical indicators
 */

import dotenv from 'dotenv';
dotenv.config({ override: true });

import { technicalIndicatorsService } from '../services/indicators/technical-indicators.service';
import { binanceService } from '../services/binance/binance.service';

async function testSimple() {
  console.log('🔧 Simple Test...\n');

  try {
    // 1. 测试获取K线数据
    console.log('Step 1: Get Klines');
    const klines = await binanceService.getKlines('BTCUSDT', '1h', 100);
    console.log(`✅ Got ${klines.length} klines`);
    console.log(`   First kline: ${JSON.stringify(klines[0])}`);

    // 2. 测试提取收盘价
    console.log('\nStep 2: Extract Close Prices');
    const closePrices = klines.map(k => parseFloat(k.close));
    console.log(`✅ Got ${closePrices.length} close prices`);
    console.log(`   First price: ${closePrices[0]}`);
    console.log(`   Last price: ${closePrices[closePrices.length - 1]}`);

    // 3. 测试 MACD 计算
    console.log('\nStep 3: Calculate MACD');
    const macd = technicalIndicatorsService.calculateMACD(closePrices);
    console.log(`✅ Calculated ${macd.length} MACD values`);
    const lastMACD = macd[macd.length - 1];
    console.log(`   Last MACD: ${JSON.stringify(lastMACD)}`);

    // 4. 测试 RSI 计算
    console.log('\nStep 4: Calculate RSI');
    const rsi = technicalIndicatorsService.calculateRSI(closePrices);
    console.log(`✅ Calculated ${rsi.length} RSI values`);
    const lastRSI = rsi[rsi.length - 1];
    console.log(`   Last RSI: ${JSON.stringify(lastRSI)}`);

    // 5. 测试 Bollinger Bands 计算
    console.log('\nStep 5: Calculate Bollinger Bands');
    const bb = technicalIndicatorsService.calculateBollingerBands(closePrices);
    console.log(`✅ Calculated ${bb.length} BB values`);
    const lastBB = bb[bb.length - 1];
    console.log(`   Last BB: ${JSON.stringify(lastBB)}`);

    console.log('\n✅ All steps completed!');
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testSimple();
