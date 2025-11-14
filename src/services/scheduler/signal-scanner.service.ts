/**
 * Signal Scanner Service
 * 定时任务：扫描交易对并生成信号
 */

import cron from 'node-cron';
import { signalGeneratorService } from '../signals/signal-generator.service';
import { copyTradeService } from '../trading/copy-trade.service';
import { Server as SocketIOServer } from 'socket.io';

export interface ScannerConfig {
  symbols: string[];
  interval: string; // K线周期（'1h', '15m' 等）
  scanFrequency: string; // Cron 表达式
}

export interface ScanResult {
  timestamp: number;
  symbolsScanned: number;
  signalsGenerated: number;
  errors: string[];
  signals: any[];
}

/**
 * 信号扫描服务类
 */
export class SignalScannerService {
  private cronJobs: Map<string, cron.ScheduledTask> = new Map();
  private io: SocketIOServer | null = null;
  private isRunning: boolean = false;
  private lastScanResult: ScanResult | null = null;

  /**
   * 设置 Socket.IO 实例（用于推送信号）
   */
  setSocketIO(io: SocketIOServer) {
    this.io = io;
    console.log('✅ Socket.IO attached to Signal Scanner');
  }

  /**
   * 启动默认扫描任务
   */
  startDefaultScanner() {
    const defaultConfig: ScannerConfig = {
      symbols: ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'],
      interval: '1h',
      scanFrequency: '*/15 * * * *', // 每15分钟扫描一次
    };

    this.startScanner('default', defaultConfig);
  }

  /**
   * 启动自定义扫描任务
   */
  startScanner(name: string, config: ScannerConfig) {
    // 如果已存在同名任务，先停止
    if (this.cronJobs.has(name)) {
      console.log(`⚠️  Scanner "${name}" already exists, stopping it first`);
      this.stopScanner(name);
    }

    // 验证 cron 表达式
    if (!cron.validate(config.scanFrequency)) {
      throw new Error(`Invalid cron expression: ${config.scanFrequency}`);
    }

    // 创建定时任务
    const task = cron.schedule(config.scanFrequency, async () => {
      await this.runScan(config);
    });

    this.cronJobs.set(name, task);
    this.isRunning = true;

    console.log(`✅ Signal Scanner "${name}" started`);
    console.log(`   Symbols: ${config.symbols.join(', ')}`);
    console.log(`   Interval: ${config.interval}`);
    console.log(`   Frequency: ${config.scanFrequency}`);
  }

  /**
   * 停止指定扫描任务
   */
  stopScanner(name: string) {
    const task = this.cronJobs.get(name);
    if (task) {
      task.stop();
      this.cronJobs.delete(name);
      console.log(`✅ Signal Scanner "${name}" stopped`);

      if (this.cronJobs.size === 0) {
        this.isRunning = false;
      }
    } else {
      console.log(`⚠️  Scanner "${name}" not found`);
    }
  }

  /**
   * 停止所有扫描任务
   */
  stopAllScanners() {
    this.cronJobs.forEach((task, name) => {
      task.stop();
      console.log(`✅ Signal Scanner "${name}" stopped`);
    });

    this.cronJobs.clear();
    this.isRunning = false;
    console.log('✅ All Signal Scanners stopped');
  }

  /**
   * 手动执行一次扫描
   */
  async runScan(config: ScannerConfig): Promise<ScanResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const signals: any[] = [];

    console.log(`\n🔍 Starting signal scan at ${new Date().toLocaleString()}`);
    console.log(`   Scanning ${config.symbols.length} symbols...`);

    try {
      // 批量生成信号
      const results = await signalGeneratorService.generateSignalsForMultipleSymbols(
        config.symbols,
        config.interval,
        100 // 使用最近100个K线
      );

      // 收集结果
      results.forEach((result) => {
        signals.push({
          id: result.signal.id,
          symbol: result.signal.symbol,
          signalType: result.signal.signalType,
          price: parseFloat(result.signal.price),
          confidence: result.signal.confidence * 100,
          status: result.signal.status,
          createdAt: result.signal.createdAt,
        });
      });

      // 通过 WebSocket 推送新信号 + 触发跟买检查
      if (this.io) {
        for (const signal of signals) {
          // 推送到全局信号频道
          this.io.emit('signal:new', signal);

          // 推送到特定交易对频道
          this.io.emit(`signal:${signal.symbol}`, signal);

          console.log(`📡 Signal pushed: ${signal.symbol} ${signal.signalType} @ $${signal.price.toFixed(2)}`);

          // 触发跟买检查
          await copyTradeService.handleNewSignal(signal.id).catch((error) => {
            console.error(`⚠️  Copy trade check failed for signal ${signal.id}: ${error.message}`);
          });
        }
      }

      const duration = Date.now() - startTime;
      const scanResult: ScanResult = {
        timestamp: Date.now(),
        symbolsScanned: config.symbols.length,
        signalsGenerated: signals.length,
        errors,
        signals,
      };

      this.lastScanResult = scanResult;

      console.log(`✅ Scan completed in ${duration}ms`);
      console.log(`   Generated ${signals.length} signals`);

      return scanResult;
    } catch (error: any) {
      const errorMsg = `Scan failed: ${error.message}`;
      errors.push(errorMsg);
      console.error(`❌ ${errorMsg}`);

      const scanResult: ScanResult = {
        timestamp: Date.now(),
        symbolsScanned: config.symbols.length,
        signalsGenerated: signals.length,
        errors,
        signals,
      };

      this.lastScanResult = scanResult;
      return scanResult;
    }
  }

  /**
   * 获取扫描器状态
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeScanners: Array.from(this.cronJobs.keys()),
      scannerCount: this.cronJobs.size,
      lastScanResult: this.lastScanResult,
      hasSocketIO: this.io !== null,
    };
  }

  /**
   * 获取最后一次扫描结果
   */
  getLastScanResult(): ScanResult | null {
    return this.lastScanResult;
  }

  /**
   * 列出所有活跃的扫描器
   */
  listScanners(): string[] {
    return Array.from(this.cronJobs.keys());
  }
}

// 单例导出
export const signalScannerService = new SignalScannerService();
