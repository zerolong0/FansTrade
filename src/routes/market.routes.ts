/**
 * Market Data Routes
 * 市场数据 API 路由
 */

import { Router } from 'express';
import * as marketController from '../controllers/market.controller';

const router = Router();

/**
 * GET /api/market/price/:symbol
 * 获取单个交易对的实时价格
 * 示例: /api/market/price/BTCUSDT
 */
router.get('/price/:symbol', marketController.getPrice);

/**
 * GET /api/market/prices?symbols=BTCUSDT,ETHUSDT,BNBUSDT
 * 获取多个交易对的实时价格
 * 查询参数: symbols (逗号分隔的交易对列表)
 */
router.get('/prices', marketController.getPrices);

/**
 * GET /api/market/klines/:symbol?interval=1h&limit=100
 * 获取 K 线数据
 * 示例: /api/market/klines/BTCUSDT?interval=1h&limit=100
 * 查询参数:
 *   - interval: 时间间隔 (1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w, 1M)
 *   - limit: 数量限制 (1-1000, 默认 100)
 */
router.get('/klines/:symbol', marketController.getKlines);

/**
 * GET /api/market/pairs?isActive=true&page=1&limit=50&search=BTC
 * 获取所有支持的交易对列表（分页）
 * 查询参数:
 *   - isActive: 过滤激活状态 (true/false)
 *   - page: 页码 (默认 1)
 *   - limit: 每页数量 (1-100, 默认 50)
 *   - search: 搜索关键词 (匹配 symbol 或 baseAsset)
 */
router.get('/pairs', marketController.getTradingPairs);

/**
 * GET /api/market/pairs/:symbol
 * 获取单个交易对详情
 * 示例: /api/market/pairs/BTCUSDT
 */
router.get('/pairs/:symbol', marketController.getTradingPair);

/**
 * POST /api/market/sync-pairs
 * 手动同步交易对信息（管理员功能）
 */
router.post('/sync-pairs', marketController.syncTradingPairs);

/**
 * GET /api/market/stats
 * 获取交易对统计信息
 */
router.get('/stats', marketController.getMarketStats);

export default router;
