# FansTrade 完整流程实施计划

> 基于 Binance.com 的用户注册 → 跟买 → 交易完整路径
> 创建时间: 2025-01-14

## 业务流程概览

```
┌─────────────────────────────────────────────────────────────────┐
│                    完整业务流程图                                │
└─────────────────────────────────────────────────────────────────┘

1. 用户注册阶段
   ├─ 用户在 FansTrade 注册账户
   ├─ 验证邮箱和设置密码
   └─ 进入 Dashboard

2. 绑定 Binance 阶段
   ├─ 用户前往 Binance.com 创建 API Key
   ├─ 在 FansTrade 输入 API Key + Secret
   ├─ 系统验证 API Key 有效性（调用 Binance accountInfo）
   ├─ 加密存储到数据库
   └─ 显示账户余额和持仓

3. 关注交易员阶段
   ├─ 浏览交易员列表（按胜率/收益排序）
   ├─ 查看交易员详情（历史信号、胜率、风格）
   ├─ 点击关注按钮
   └─ 设置跟单配置（自动/手动、最大金额、交易对过滤）

4. 交易信号生成阶段（系统自动）
   ├─ 定时任务每 5 分钟扫描市场
   ├─ 计算技术指标（MACD, RSI, Bollinger Bands）
   ├─ 生成交易信号（BUY/SELL/HOLD + 置信度）
   ├─ 保存到数据库（binance_trading_signals）
   └─ WebSocket 推送给关注者

5. 跟单执行阶段
   ├─ 关注者收到信号推送
   ├─ 自动模式：系统自动执行（带风控检查）
   │  ├─ 检查账户余额
   │  ├─ 检查单笔限额
   │  ├─ 调用 Binance API 下单
   │  └─ 记录交易结果
   └─ 手动模式：用户确认后执行

6. 交易记录和统计阶段
   ├─ 显示实时持仓
   ├─ 显示历史交易记录
   ├─ 计算盈亏统计
   └─ 生成交易报告
```

---

## Phase 2: Binance API 封装（6-8 小时）

### 目标
实现完整的 Binance REST API 和 WebSocket 封装，支持市场数据、账户查询、下单功能。

### Task 2.1: Binance Service 核心封装

**文件**: `src/services/binance/binance.service.ts`

**功能清单**:
1. ✅ 公共客户端（无需 API Key）
   - 获取实时价格
   - 获取 K 线数据
   - 获取交易对信息

2. ✅ 私有客户端（需要用户 API Key）
   - 解密用户 API Key
   - 创建授权客户端
   - 客户端缓存管理

3. ✅ 账户功能
   - 查询账户余额
   - 查询历史订单
   - 查询当前挂单

4. ✅ 交易功能
   - 市价单下单
   - 限价单下单
   - 取消订单

5. ✅ Redis 缓存层
   - 价格缓存（5 秒 TTL）
   - K 线缓存（60 秒 TTL）
   - 交易对信息缓存（1 小时 TTL）

**代码结构**:
```typescript
export class BinanceService {
  // 公共 API
  getPublicClient(): MainClient
  getCurrentPrice(symbol: string): Promise<number>
  getKlines(symbol: string, interval: string, limit?: number): Promise<Kline[]>
  getExchangeInfo(): Promise<ExchangeInfo>

  // 私有 API
  getPrivateClient(userId: string): Promise<MainClient>
  getAccountBalance(userId: string): Promise<Balance[]>
  getAccountInfo(userId: string): Promise<AccountInfo>
  getOpenOrders(userId: string, symbol?: string): Promise<Order[]>

  // 交易 API
  placeMarketOrder(userId: string, params: MarketOrderParams): Promise<OrderResult>
  placeLimitOrder(userId: string, params: LimitOrderParams): Promise<OrderResult>
  cancelOrder(userId: string, symbol: string, orderId: string): Promise<boolean>

  // 辅助功能
  syncTradingPairs(): Promise<void>  // 同步所有交易对到数据库
  validateApiKey(apiKey: string, apiSecret: string): Promise<boolean>
}
```

**验收标准**:
- [ ] 获取 BTC/USDT 实时价格成功
- [ ] 获取 BTC/USDT 1小时 K线成功
- [ ] 使用测试 API Key 查询余额成功
- [ ] Redis 缓存命中率 > 80%
- [ ] 单元测试覆盖率 > 80%

---

### Task 2.2: Binance WebSocket 实时推送服务

**文件**: `src/services/binance/websocket.service.ts`

**功能清单**:
1. ✅ 价格推送
   - 订阅多个交易对实时价格
   - 解析 ticker 数据
   - 广播给前端

2. ✅ K 线推送
   - 订阅 1分钟/5分钟/1小时 K线
   - 实时更新图表

3. ✅ 用户数据流
   - 订阅订单更新
   - 订阅账户余额变化

4. ✅ 连接池管理
   - 复用 WebSocket 连接
   - 自动重连机制
   - 心跳检测

**代码结构**:
```typescript
export class BinanceWebSocketService extends EventEmitter {
  // 市场数据流
  subscribePriceTicker(symbols: string[]): void
  subscribeKline(symbol: string, interval: string): void
  subscribeDepth(symbol: string): void

  // 用户数据流
  subscribeUserDataStream(userId: string): void

  // 连接管理
  getConnection(streamName: string): WebSocket
  closeConnection(streamName: string): void
  closeAll(): void

  // 事件监听
  on('price', (data: PriceTickerData) => void)
  on('kline', (data: KlineData) => void)
  on('order', (data: OrderUpdateData) => void)
  on('balance', (data: BalanceUpdateData) => void)
}
```

**验收标准**:
- [ ] 实时价格推送延迟 < 100ms
- [ ] WebSocket 连接稳定运行 > 1小时
- [ ] 自动重连测试通过
- [ ] 同时订阅 10 个交易对无压力

---

### Task 2.3: 用户绑定 Binance API Key 流程

**后端 API**: `POST /api/binance/bind-api-key`

**前端页面**: `/app/settings/binance/page.tsx`

**业务流程**:
```
1. 用户输入 API Key + Secret
2. 前端调用 POST /api/binance/bind-api-key
3. 后端验证 API Key 有效性
   - 调用 Binance accountInfo()
   - 检查权限（必须有 spot 权限）
4. 加密存储到数据库
5. 返回成功 + 账户余额
6. 前端显示绑定成功提示
```

**安全措施**:
- API Secret 加密存储（AES-256-GCM）
- 永不在日志中记录明文 API Key
- 支持 IP 白名单（可选）
- 支持只读模式（只查询，不交易）

**前端 UI**:
```typescript
// 绑定 API Key 表单
<Card>
  <CardHeader>
    <CardTitle>绑定 Binance 账户</CardTitle>
    <CardDescription>
      前往 <a href="https://www.binance.com/en/my/settings/api-management">Binance API 管理</a> 创建 API Key
    </CardDescription>
  </CardHeader>
  <CardContent>
    <Form>
      <Input label="API Key" placeholder="输入 Binance API Key" />
      <Input label="API Secret" type="password" placeholder="输入 API Secret" />
      <Input label="标签（可选）" placeholder="主账户" />
      <Checkbox label="启用现货交易" checked />
      <Button type="submit">验证并绑定</Button>
    </Form>
  </CardContent>
</Card>

// 已绑定账户列表
<Card>
  <CardHeader>
    <CardTitle>我的 Binance 账户</CardTitle>
  </CardHeader>
  <CardContent>
    <AccountCard>
      <Badge>主账户</Badge>
      <div>余额: 1,234.56 USDT</div>
      <div>绑定时间: 2025-01-14</div>
      <Button variant="outline">解绑</Button>
    </AccountCard>
  </CardContent>
</Card>
```

**验收标准**:
- [ ] 输入有效 API Key 绑定成功
- [ ] 输入无效 API Key 提示错误
- [ ] 数据库加密存储验证通过
- [ ] 绑定后显示账户余额
- [ ] 可以解绑 API Key

---

### Task 2.4: 交易对同步和市场数据接口

**API 路由**:
```typescript
// 获取所有交易对列表
GET /api/binance/pairs
Response: { pairs: TradingPair[] }

// 获取单个交易对详情
GET /api/binance/pairs/:symbol
Response: { pair: TradingPair, price: number, volume24h: number }

// 获取实时价格
GET /api/binance/price/:symbol
Response: { symbol: string, price: number, timestamp: number }

// 获取 K 线数据
GET /api/binance/klines/:symbol?interval=1h&limit=100
Response: { symbol: string, klines: Kline[] }

// 获取账户余额
GET /api/binance/balance
Response: { balances: Balance[] }
```

**定时任务**: 每小时同步交易对信息
```typescript
// src/jobs/sync-trading-pairs.job.ts
cron.schedule('0 * * * *', async () => {
  const exchangeInfo = await binanceService.getExchangeInfo();

  for (const symbol of exchangeInfo.symbols) {
    await prisma.tradingPair.upsert({
      where: { symbol: symbol.symbol },
      update: {
        status: symbol.status,
        minPrice: symbol.filters.PRICE_FILTER.minPrice,
        maxPrice: symbol.filters.PRICE_FILTER.maxPrice,
        // ...
        lastSyncAt: new Date(),
      },
      create: {
        symbol: symbol.symbol,
        baseAsset: symbol.baseAsset,
        quoteAsset: symbol.quoteAsset,
        // ...
      }
    });
  }

  console.log(`✅ Synced ${exchangeInfo.symbols.length} trading pairs`);
});
```

**验收标准**:
- [ ] 交易对同步任务正常运行
- [ ] 数据库存储 > 500 个交易对
- [ ] 实时价格 API 响应 < 50ms
- [ ] K 线数据格式正确

---

## Phase 3: 交易信号生成引擎（8-10 小时）

### Task 3.1: 技术指标计算引擎

**文件**: `src/services/trading-signals/indicators.service.ts`

**支持的指标**:
1. MACD（移动平均收敛散度）
2. RSI（相对强弱指数）
3. Bollinger Bands（布林带）
4. EMA（指数移动平均）
5. SMA（简单移动平均）

**代码结构**:
```typescript
export class IndicatorsService {
  async calculateMACD(symbol: string, interval: string): Promise<MACDResult> {
    const klines = await binanceService.getKlines(symbol, interval, 100);
    const closePrices = klines.map(k => k.close);

    const macd = new MACD({ shortInterval: 12, longInterval: 26, signalInterval: 9 });
    for (const price of closePrices) {
      macd.update(price);
    }

    return {
      macd: macd.getResult().macd,
      signal: macd.getResult().signal,
      histogram: macd.getResult().histogram,
      crossover: this.detectCrossover(macd),  // 金叉/死叉
    };
  }

  async calculateRSI(symbol: string, interval: string): Promise<RSIResult> {
    const klines = await binanceService.getKlines(symbol, interval, 100);
    const rsi = new RSI(14);

    for (const kline of klines) {
      rsi.update(kline.close);
    }

    const value = rsi.getResult();

    return {
      value,
      overbought: value > 70,     // 超买
      oversold: value < 30,        // 超卖
      signal: value < 30 ? 'BUY' : value > 70 ? 'SELL' : 'HOLD',
    };
  }

  async calculateBollingerBands(symbol: string, interval: string): Promise<BBResult> {
    const klines = await binanceService.getKlines(symbol, interval, 100);
    const bb = new BollingerBands(20, 2);

    for (const kline of klines) {
      bb.update(kline.close);
    }

    const result = bb.getResult();
    const currentPrice = klines[klines.length - 1].close;

    return {
      upper: result.upper,
      middle: result.middle,
      lower: result.lower,
      bandwidth: (result.upper - result.lower) / result.middle,
      signal: currentPrice < result.lower ? 'BUY' : currentPrice > result.upper ? 'SELL' : 'HOLD',
    };
  }

  // 综合分析
  async analyzeSymbol(symbol: string, interval: string = '1h'): Promise<SignalAnalysis> {
    const [macd, rsi, bb] = await Promise.all([
      this.calculateMACD(symbol, interval),
      this.calculateRSI(symbol, interval),
      this.calculateBollingerBands(symbol, interval),
    ]);

    // 投票机制：3 个指标中至少 2 个同意才发信号
    const signals = [macd.signal, rsi.signal, bb.signal];
    const buyVotes = signals.filter(s => s === 'BUY').length;
    const sellVotes = signals.filter(s => s === 'SELL').length;

    let finalSignal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let confidence = 0;

    if (buyVotes >= 2) {
      finalSignal = 'BUY';
      confidence = buyVotes / 3;
    } else if (sellVotes >= 2) {
      finalSignal = 'SELL';
      confidence = sellVotes / 3;
    }

    return {
      symbol,
      interval,
      signal: finalSignal,
      confidence,
      indicators: { macd, rsi, bb },
      timestamp: new Date(),
    };
  }
}
```

**验收标准**:
- [ ] MACD 计算准确（与 TradingView 对比误差 < 1%）
- [ ] RSI 计算准确
- [ ] Bollinger Bands 计算准确
- [ ] 综合信号置信度合理

---

### Task 3.2: 交易信号生成和存储

**文件**: `src/services/trading-signals/signal-generator.service.ts`

**业务逻辑**:
```typescript
export class SignalGeneratorService {
  async generateSignal(
    symbol: string,
    interval: string,
    strategyId?: string
  ): Promise<BinanceTradingSignal> {
    // 1. 分析技术指标
    const analysis = await indicatorsService.analyzeSymbol(symbol, interval);

    // 2. 只有置信度 > 0.6 才生成信号
    if (analysis.confidence < 0.6) {
      console.log(`❌ ${symbol} signal confidence too low: ${analysis.confidence}`);
      return null;
    }

    // 3. 获取当前价格
    const currentPrice = await binanceService.getCurrentPrice(symbol);

    // 4. 获取交易对
    const tradingPair = await prisma.tradingPair.findUnique({
      where: { symbol }
    });

    if (!tradingPair) {
      throw new Error(`Trading pair ${symbol} not found`);
    }

    // 5. 保存信号到数据库
    const signal = await prisma.binanceTradingSignal.create({
      data: {
        symbol,
        signalType: analysis.signal,
        price: currentPrice.toString(),
        confidence: analysis.confidence,
        indicators: analysis.indicators,
        status: 'PENDING',
        tradingPairId: tradingPair.id,
        strategyId,
      }
    });

    console.log(`✅ Generated ${analysis.signal} signal for ${symbol} @ ${currentPrice} (confidence: ${analysis.confidence})`);

    return signal;
  }

  async generateSignalsForWatchlist(symbols: string[]): Promise<BinanceTradingSignal[]> {
    const signals = [];

    for (const symbol of symbols) {
      try {
        const signal = await this.generateSignal(symbol, '1h');
        if (signal) {
          signals.push(signal);
        }
      } catch (error) {
        console.error(`Error generating signal for ${symbol}:`, error);
      }
    }

    return signals;
  }
}
```

**验收标准**:
- [ ] 信号生成成功存储到数据库
- [ ] 信号包含完整的指标数据
- [ ] 置信度计算合理
- [ ] 批量生成信号无错误

---

### Task 3.3: 定时任务扫描和信号推送

**文件**: `src/jobs/signal-scanner.job.ts`

**定时任务**:
```typescript
import cron from 'node-cron';
import { signalGeneratorService } from '../services/trading-signals/signal-generator.service';
import { io } from '../index';  // Socket.IO instance

// 每 5 分钟扫描一次热门交易对
cron.schedule('*/5 * * * *', async () => {
  console.log('🔍 [Signal Scanner] Starting scan...');

  // 获取所有活跃的监控交易对
  const watchlist = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'ADAUSDT'];

  const signals = await signalGeneratorService.generateSignalsForWatchlist(watchlist);

  console.log(`✅ [Signal Scanner] Generated ${signals.length} signals`);

  // 推送给所有在线用户
  for (const signal of signals) {
    // 查找关注了相关策略的用户
    const followers = await prisma.follow.findMany({
      where: {
        trader: {
          strategies: {
            some: {
              binanceSignals: {
                some: { id: signal.id }
              }
            }
          }
        }
      },
      include: { follower: true }
    });

    // WebSocket 推送
    for (const follow of followers) {
      io.to(`user_${follow.followerId}`).emit('new_signal', {
        signal: {
          id: signal.id,
          symbol: signal.symbol,
          signalType: signal.signalType,
          price: signal.price,
          confidence: signal.confidence,
        },
        trader: follow.trader,
      });
    }

    console.log(`📡 Pushed signal ${signal.id} to ${followers.length} followers`);
  }
});

// 每小时清理过期信号（24小时未执行）
cron.schedule('0 * * * *', async () => {
  const expiredCount = await prisma.binanceTradingSignal.updateMany({
    where: {
      status: 'PENDING',
      createdAt: {
        lt: new Date(Date.now() - 24 * 60 * 60 * 1000)  // 24 hours ago
      }
    },
    data: {
      status: 'EXPIRED'
    }
  });

  console.log(`🗑️  Expired ${expiredCount.count} old signals`);
});
```

**验收标准**:
- [ ] 定时任务每 5 分钟正常运行
- [ ] 信号推送给正确的关注者
- [ ] WebSocket 推送延迟 < 1秒
- [ ] 过期信号清理正常

---

## Phase 4: 跟买和交易执行（8-10 小时）

### Task 4.1: 跟买逻辑实现

**文件**: `src/services/copy-trading/copy-trading.service.ts`

**业务逻辑**:
```typescript
export class CopyTradingService {
  async executeCopyTrade(
    followerId: string,
    signalId: string,
    mode: 'AUTO' | 'MANUAL'
  ): Promise<ExecutionResult> {
    // 1. 获取信号
    const signal = await prisma.binanceTradingSignal.findUnique({
      where: { id: signalId },
      include: { tradingPair: true }
    });

    if (!signal || signal.status !== 'PENDING') {
      throw new Error('Signal not available for execution');
    }

    // 2. 获取关注配置
    const follow = await prisma.follow.findFirst({
      where: {
        followerId,
        trader: {
          strategies: {
            some: {
              binanceSignals: {
                some: { id: signalId }
              }
            }
          }
        }
      }
    });

    if (!follow) {
      throw new Error('You are not following this trader');
    }

    const config = follow.config as CopyTradeConfig;

    // 3. 风控检查
    await this.performRiskChecks(followerId, signal, config);

    // 4. 计算交易数量
    const quantity = await this.calculateTradeQuantity(followerId, signal, config);

    // 5. 执行交易
    if (mode === 'AUTO') {
      return await this.executeTradeAuto(followerId, signal, quantity);
    } else {
      // 手动模式：只创建待确认订单
      return await this.createPendingOrder(followerId, signal, quantity);
    }
  }

  private async performRiskChecks(
    userId: string,
    signal: BinanceTradingSignal,
    config: CopyTradeConfig
  ): Promise<void> {
    // 检查 1: 账户余额
    const balances = await binanceService.getAccountBalance(userId);
    const usdtBalance = balances.find(b => b.asset === 'USDT');

    if (!usdtBalance || parseFloat(usdtBalance.free) < config.minBalance) {
      throw new Error('Insufficient balance');
    }

    // 检查 2: 单笔限额
    const orderValue = parseFloat(signal.price) * config.maxQuantity;
    if (orderValue > config.maxAmountPerTrade) {
      throw new Error(`Order value ${orderValue} exceeds max amount ${config.maxAmountPerTrade}`);
    }

    // 检查 3: 交易对过滤
    if (config.symbolsFilter && !config.symbolsFilter.includes(signal.symbol)) {
      throw new Error(`Symbol ${signal.symbol} is not in your filter list`);
    }

    // 检查 4: 每日亏损熔断
    const todayLoss = await this.calculateTodayLoss(userId);
    if (todayLoss > config.maxDailyLoss) {
      throw new Error(`Daily loss limit reached: ${todayLoss}`);
    }
  }

  private async executeTradeAuto(
    userId: string,
    signal: BinanceTradingSignal,
    quantity: number
  ): Promise<ExecutionResult> {
    try {
      // 调用 Binance API 下单
      const order = await binanceService.placeMarketOrder(userId, {
        symbol: signal.symbol,
        side: signal.signalType === 'BUY' ? 'BUY' : 'SELL',
        quantity,
      });

      // 更新信号状态
      await prisma.binanceTradingSignal.update({
        where: { id: signal.id },
        data: {
          status: 'EXECUTED',
          executedAt: new Date(),
          executedPrice: order.fills[0].price,
        }
      });

      // 记录交易
      await prisma.tradeSignal.create({
        data: {
          traderId: userId,
          exchange: 'binance',
          action: signal.signalType.toLowerCase(),
          symbol: signal.symbol,
          quantity,
          price: parseFloat(order.fills[0].price),
          reason: `Copy trade from signal ${signal.id}`,
        }
      });

      return {
        success: true,
        orderId: order.orderId,
        executedPrice: order.fills[0].price,
        executedQuantity: quantity,
      };
    } catch (error) {
      console.error('Execute trade error:', error);
      throw new Error(`Failed to execute trade: ${error.message}`);
    }
  }
}
```

**验收标准**:
- [ ] 自动跟单成功执行
- [ ] 风控检查正常工作
- [ ] 交易记录正确保存
- [ ] 余额不足时拒绝交易

---

## 下一步行动

现在开始实施 **Phase 2.1: Binance Service 核心封装**。

需要我立即开始吗？
