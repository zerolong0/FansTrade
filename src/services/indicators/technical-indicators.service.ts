/**
 * Technical Indicators Service
 * 技术指标计算服务（MACD、RSI、Bollinger Bands）
 */

import {
  MACD,
  RSI,
  BollingerBands,
  EMA,
} from 'trading-signals';
import { binanceService, Kline } from '../binance/binance.service';

// 类型定义
export interface MACDResult {
  timestamp: number;
  macd: number | null;
  signal: number | null;
  histogram: number | null;
}

export interface RSIResult {
  timestamp: number;
  rsi: number | null;
}

export interface BBResult {
  timestamp: number;
  upper: number | null;
  middle: number | null;
  lower: number | null;
  bandwidth: number | null;
}

export interface TechnicalIndicators {
  symbol: string;
  interval: string;
  macd: MACDResult[];
  rsi: RSIResult[];
  bollingerBands: BBResult[];
  lastUpdate: number;
}

export interface SignalAnalysis {
  symbol: string;
  timestamp: number;
  currentPrice: number;
  indicators: {
    macd: {
      value: number | null;
      signal: number | null;
      histogram: number | null;
      trend: 'bullish' | 'bearish' | 'neutral';
      crossover: 'golden' | 'death' | 'none'; // 金叉/死叉
    };
    rsi: {
      value: number | null;
      condition: 'overbought' | 'oversold' | 'neutral'; // 超买/超卖
    };
    bollingerBands: {
      upper: number | null;
      middle: number | null;
      lower: number | null;
      position: 'above_upper' | 'below_lower' | 'within' | 'unknown';
      bandwidth: number | null;
      squeeze: boolean; // 布林带收窄（波动率降低）
    };
  };
  signal: 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell';
  confidence: number; // 0-100
  reasons: string[];
}

/**
 * 技术指标服务类
 */
export class TechnicalIndicatorsService {
  /**
   * 计算 MACD（指数平滑异同移动平均线）
   * 参数：短期EMA=12, 长期EMA=26, 信号线=9
   */
  calculateMACD(
    closePrices: number[],
    fastPeriod: number = 12,
    slowPeriod: number = 26,
    signalPeriod: number = 9
  ): MACDResult[] {
    if (closePrices.length < slowPeriod + signalPeriod) {
      throw new Error(`Need at least ${slowPeriod + signalPeriod} data points for MACD`);
    }

    // 修正：MACD 构造函数需要三个 EMA 实例
    const shortEMA = new EMA(fastPeriod);
    const longEMA = new EMA(slowPeriod);
    const signalEMA = new EMA(signalPeriod);
    const macd = new MACD(shortEMA, longEMA, signalEMA);

    const results: MACDResult[] = [];

    closePrices.forEach((price, index) => {
      macd.update(price);

      if (macd.isStable) {
        const result = macd.getResult();
        results.push({
          timestamp: Date.now() - (closePrices.length - index - 1) * 3600000, // 假设1小时间隔
          macd: result.macd || null,
          signal: result.signal || null,
          histogram: result.histogram || null,
        });
      } else {
        results.push({
          timestamp: Date.now() - (closePrices.length - index - 1) * 3600000,
          macd: null,
          signal: null,
          histogram: null,
        });
      }
    });

    return results;
  }

  /**
   * 计算 RSI（相对强弱指数）
   * 参数：周期=14
   */
  calculateRSI(closePrices: number[], period: number = 14): RSIResult[] {
    if (closePrices.length < period + 1) {
      throw new Error(`Need at least ${period + 1} data points for RSI`);
    }

    const rsi = new RSI(period);
    const results: RSIResult[] = [];

    closePrices.forEach((price, index) => {
      rsi.update(price);

      if (rsi.isStable) {
        results.push({
          timestamp: Date.now() - (closePrices.length - index - 1) * 3600000,
          rsi: rsi.getResult() || null,
        });
      } else {
        results.push({
          timestamp: Date.now() - (closePrices.length - index - 1) * 3600000,
          rsi: null,
        });
      }
    });

    return results;
  }

  /**
   * 计算 Bollinger Bands（布林带）
   * 参数：周期=20, 标准差倍数=2
   */
  calculateBollingerBands(
    closePrices: number[],
    period: number = 20,
    stdDev: number = 2
  ): BBResult[] {
    if (closePrices.length < period) {
      throw new Error(`Need at least ${period} data points for Bollinger Bands`);
    }

    const bb = new BollingerBands(period, stdDev);
    const results: BBResult[] = [];

    closePrices.forEach((price, index) => {
      bb.update(price);

      if (bb.isStable) {
        const result = bb.getResult();
        const upper = result.upper || null;
        const middle = result.middle || null;
        const lower = result.lower || null;

        // 手动计算 bandwidth（如果库不提供）
        let bandwidth: number | null = null;
        if (upper && lower && middle) {
          bandwidth = (upper - lower) / middle;
        }

        results.push({
          timestamp: Date.now() - (closePrices.length - index - 1) * 3600000,
          upper,
          middle,
          lower,
          bandwidth,
        });
      } else {
        results.push({
          timestamp: Date.now() - (closePrices.length - index - 1) * 3600000,
          upper: null,
          middle: null,
          lower: null,
          bandwidth: null,
        });
      }
    });

    return results;
  }

  /**
   * 计算所有技术指标
   */
  async calculateAllIndicators(
    symbol: string,
    interval: string = '1h',
    limit: number = 100
  ): Promise<TechnicalIndicators> {
    // 获取K线数据
    const klines = await binanceService.getKlines(symbol, interval, limit);

    // 提取收盘价
    const closePrices = klines.map((k: Kline) => parseFloat(k.close));

    // 计算各项指标
    const macd = this.calculateMACD(closePrices);
    const rsi = this.calculateRSI(closePrices);
    const bollingerBands = this.calculateBollingerBands(closePrices);

    return {
      symbol,
      interval,
      macd,
      rsi,
      bollingerBands,
      lastUpdate: Date.now(),
    };
  }

  /**
   * 生成交易信号分析
   */
  async analyzeSignal(
    symbol: string,
    interval: string = '1h',
    limit: number = 100
  ): Promise<SignalAnalysis> {
    // 计算技术指标
    const indicators = await this.calculateAllIndicators(symbol, interval, limit);

    // 获取最新价格
    const currentPrice = await binanceService.getCurrentPrice(symbol);

    // 获取最新指标值
    const latestMACD = indicators.macd[indicators.macd.length - 1];
    const latestRSI = indicators.rsi[indicators.rsi.length - 1];
    const latestBB = indicators.bollingerBands[indicators.bollingerBands.length - 1];

    // 分析 MACD
    const macdTrend =
      latestMACD.histogram && latestMACD.histogram > 0
        ? 'bullish'
        : latestMACD.histogram && latestMACD.histogram < 0
        ? 'bearish'
        : 'neutral';

    // 检测金叉/死叉
    let macdCrossover: 'golden' | 'death' | 'none' = 'none';
    if (indicators.macd.length >= 2) {
      const prevMACD = indicators.macd[indicators.macd.length - 2];
      if (
        prevMACD.histogram &&
        latestMACD.histogram &&
        prevMACD.histogram < 0 &&
        latestMACD.histogram > 0
      ) {
        macdCrossover = 'golden'; // 金叉（买入信号）
      } else if (
        prevMACD.histogram &&
        latestMACD.histogram &&
        prevMACD.histogram > 0 &&
        latestMACD.histogram < 0
      ) {
        macdCrossover = 'death'; // 死叉（卖出信号）
      }
    }

    // 分析 RSI
    let rsiCondition: 'overbought' | 'oversold' | 'neutral' = 'neutral';
    if (latestRSI.rsi) {
      if (latestRSI.rsi > 70) {
        rsiCondition = 'overbought'; // 超买
      } else if (latestRSI.rsi < 30) {
        rsiCondition = 'oversold'; // 超卖
      }
    }

    // 分析 Bollinger Bands
    let bbPosition: 'above_upper' | 'below_lower' | 'within' | 'unknown' = 'unknown';
    let bbSqueeze = false;

    if (latestBB.upper && latestBB.lower && latestBB.middle) {
      if (currentPrice > latestBB.upper) {
        bbPosition = 'above_upper'; // 价格在上轨之上（超买）
      } else if (currentPrice < latestBB.lower) {
        bbPosition = 'below_lower'; // 价格在下轨之下（超卖）
      } else {
        bbPosition = 'within'; // 价格在上下轨之间
      }

      // 检测布林带收窄（波动率降低，可能即将突破）
      if (latestBB.bandwidth && latestBB.bandwidth < 0.05) {
        bbSqueeze = true;
      }
    }

    // 综合判断信号
    let signal: 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell' = 'neutral';
    let confidence = 50;
    const reasons: string[] = [];

    // 评分系统（-100 到 +100）
    let score = 0;

    // MACD 评分
    if (macdCrossover === 'golden') {
      score += 30;
      reasons.push('MACD 金叉（买入信号）');
    } else if (macdCrossover === 'death') {
      score -= 30;
      reasons.push('MACD 死叉（卖出信号）');
    }

    if (macdTrend === 'bullish') {
      score += 10;
      reasons.push('MACD 趋势看涨');
    } else if (macdTrend === 'bearish') {
      score -= 10;
      reasons.push('MACD 趋势看跌');
    }

    // RSI 评分
    if (rsiCondition === 'oversold') {
      score += 20;
      reasons.push(`RSI 超卖 (${latestRSI.rsi?.toFixed(2)})`);
    } else if (rsiCondition === 'overbought') {
      score -= 20;
      reasons.push(`RSI 超买 (${latestRSI.rsi?.toFixed(2)})`);
    }

    // Bollinger Bands 评分
    if (bbPosition === 'below_lower') {
      score += 15;
      reasons.push('价格触及布林带下轨（超卖）');
    } else if (bbPosition === 'above_upper') {
      score -= 15;
      reasons.push('价格触及布林带上轨（超买）');
    }

    if (bbSqueeze) {
      reasons.push('布林带收窄（即将突破）');
    }

    // 根据评分确定信号
    if (score >= 40) {
      signal = 'strong_buy';
      confidence = Math.min(50 + score, 95);
    } else if (score >= 20) {
      signal = 'buy';
      confidence = Math.min(60 + score, 85);
    } else if (score <= -40) {
      signal = 'strong_sell';
      confidence = Math.min(50 + Math.abs(score), 95);
    } else if (score <= -20) {
      signal = 'sell';
      confidence = Math.min(60 + Math.abs(score), 85);
    } else {
      signal = 'neutral';
      confidence = 50 + Math.abs(score) / 2;
    }

    if (reasons.length === 0) {
      reasons.push('无明显信号');
    }

    return {
      symbol,
      timestamp: Date.now(),
      currentPrice,
      indicators: {
        macd: {
          value: latestMACD.macd,
          signal: latestMACD.signal,
          histogram: latestMACD.histogram,
          trend: macdTrend,
          crossover: macdCrossover,
        },
        rsi: {
          value: latestRSI.rsi,
          condition: rsiCondition,
        },
        bollingerBands: {
          upper: latestBB.upper,
          middle: latestBB.middle,
          lower: latestBB.lower,
          position: bbPosition,
          bandwidth: latestBB.bandwidth,
          squeeze: bbSqueeze,
        },
      },
      signal,
      confidence,
      reasons,
    };
  }
}

// 单例导出
export const technicalIndicatorsService = new TechnicalIndicatorsService();
