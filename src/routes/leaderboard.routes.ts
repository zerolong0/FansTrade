/**
 * Leaderboard Routes
 */

import { Router } from 'express';
import { optionalAuth } from '../middleware/auth.middleware';
import * as leaderboardController from '../controllers/leaderboard.controller';

const router = Router();

// Public endpoint - no authentication required, but can enhance with auth
router.use(optionalAuth);

/**
 * GET /api/leaderboard
 * 获取交易者排行榜
 * Query params:
 *   - sortBy: profit | winRate | followers | volume | roi | trades
 *   - limit: number (default: 50)
 *   - offset: number (default: 0)
 */
router.get('/', leaderboardController.getLeaderboard);

export default router;
