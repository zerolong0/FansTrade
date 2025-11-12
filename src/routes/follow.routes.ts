import { Router, Response } from 'express';
import { followService } from '../services/follow.service';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { z } from 'zod';

const router = Router();

/**
 * Validation schemas
 */
const followConfigSchema = z.object({
  autoNotify: z.boolean().optional(),
  symbolsFilter: z.array(z.string()).optional(),
  maxAmountPerTrade: z.number().positive().optional(),
  notificationChannels: z
    .array(z.enum(['websocket', 'email', 'push']))
    .optional(),
});

const paginationSchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).optional(),
});

/**
 * POST /api/follow/:userId
 * Follow a user
 */
router.post('/:userId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { userId: traderId } = req.params;
    const followerId = req.user.userId;

    // Validate config if provided
    let config;
    if (req.body.config) {
      config = followConfigSchema.parse(req.body.config);
    }

    // Follow user
    const follow = await followService.followUser(followerId, traderId, config);

    res.status(201).json({
      message: 'Successfully followed user',
      follow: {
        id: follow.id,
        traderId: follow.traderId,
        createdAt: follow.createdAt,
        config: follow.config,
      },
      trader: follow.trader,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }

    // Handle FollowError
    if (error.name === 'FollowError') {
      res.status(error.statusCode).json({ error: error.message, code: error.code });
      return;
    }

    const message = error instanceof Error ? error.message : 'Failed to follow user';
    res.status(500).json({ error: message });
  }
});

/**
 * DELETE /api/follow/:userId
 * Unfollow a user
 */
router.delete('/:userId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { userId: traderId } = req.params;
    const followerId = req.user.userId;

    // Unfollow user
    await followService.unfollowUser(followerId, traderId);

    res.json({
      message: 'Successfully unfollowed user',
    });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : 'Failed to unfollow user';
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/follow/following
 * Get list of users I'm following
 */
router.get('/following', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Validate pagination
    const pagination = paginationSchema.parse(req.query);

    // Get following list
    const result = await followService.getFollowing(req.user.userId, pagination);

    res.json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }

    const message = error instanceof Error ? error.message : 'Failed to get following list';
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/follow/followers
 * Get list of users following me
 */
router.get('/followers', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Validate pagination
    const pagination = paginationSchema.parse(req.query);

    // Get followers list
    const result = await followService.getFollowers(req.user.userId, pagination);

    res.json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }

    const message = error instanceof Error ? error.message : 'Failed to get followers list';
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/follow/check/:userId
 * Check if I'm following a user
 */
router.get('/check/:userId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { userId: traderId } = req.params;
    const followerId = req.user.userId;

    const isFollowing = await followService.isFollowing(followerId, traderId);

    res.json({
      isFollowing,
    });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : 'Failed to check follow status';
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/follow/stats/:userId
 * Get follow statistics for a user
 */
router.get('/stats/:userId', async (req, res: Response) => {
  try {
    const { userId } = req.params;

    const stats = await followService.getFollowStats(userId);

    res.json({
      userId,
      ...stats,
    });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : 'Failed to get follow stats';
    res.status(500).json({ error: message });
  }
});

export default router;
