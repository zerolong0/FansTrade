/**
 * Binance API Key Routes
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as binanceApiKeyController from '../controllers/binance-api-key.controller';

const router = Router();

// 所有路由都需要认证
router.use(authenticate);

/**
 * POST /api/binance/api-keys/validate
 * 验证 API Key（不保存）
 */
router.post('/validate', binanceApiKeyController.validateApiKey);

/**
 * POST /api/binance/api-keys
 * 绑定新的 API Key
 */
router.post('/', binanceApiKeyController.createApiKey);

/**
 * GET /api/binance/api-keys
 * 获取用户的所有 API Keys
 */
router.get('/', binanceApiKeyController.getApiKeys);

/**
 * DELETE /api/binance/api-keys/:id
 * 删除指定的 API Key
 */
router.delete('/:id', binanceApiKeyController.deleteApiKey);

/**
 * PUT /api/binance/api-keys/:id/toggle
 * 切换 API Key 激活状态
 */
router.put('/:id/toggle', binanceApiKeyController.toggleApiKey);

export default router;
