import { prisma } from '../config/database';

/**
 * Configuration for follow relationship
 */
export interface FollowConfig {
  autoNotify?: boolean;
  symbolsFilter?: string[];
  maxAmountPerTrade?: number;
  notificationChannels?: ('websocket' | 'email' | 'push')[];
}

/**
 * Custom error class for follow-related errors
 */
export class FollowError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number
  ) {
    super(message);
    this.name = 'FollowError';
  }
}

/**
 * Service for managing follow relationships between users
 */
export class FollowService {
  /**
   * Follow a user
   */
  async followUser(
    followerId: string,
    traderId: string,
    config?: FollowConfig
  ): Promise<any> {
    // Validation: Cannot follow yourself
    if (followerId === traderId) {
      throw new FollowError(
        'Cannot follow yourself',
        'CANNOT_FOLLOW_SELF',
        400
      );
    }

    // Check if trader exists
    const trader = await prisma.user.findUnique({
      where: { id: traderId },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        isVerified: true,
      },
    });

    if (!trader) {
      throw new FollowError('User not found', 'USER_NOT_FOUND', 404);
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_traderId: {
          followerId,
          traderId,
        },
      },
    });

    if (existingFollow) {
      throw new FollowError(
        'Already following this user',
        'ALREADY_FOLLOWING',
        400
      );
    }

    // Create follow relationship
    const follow = await prisma.follow.create({
      data: {
        followerId,
        traderId,
        config: config || {},
      },
      include: {
        trader: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            isVerified: true,
          },
        },
      },
    });

    return follow;
  }

  /**
   * Unfollow a user
   */
  async unfollowUser(
    followerId: string,
    traderId: string
  ): Promise<void> {
    throw new Error('Not implemented');
  }

  /**
   * Get list of users that a user is following
   */
  async getFollowing(
    userId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<any> {
    throw new Error('Not implemented');
  }

  /**
   * Get list of users following a user
   */
  async getFollowers(
    traderId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<any> {
    throw new Error('Not implemented');
  }

  /**
   * Check if a user is following another user
   */
  async isFollowing(
    followerId: string,
    traderId: string
  ): Promise<boolean> {
    throw new Error('Not implemented');
  }

  /**
   * Get follow statistics for a user
   */
  async getFollowStats(
    userId: string
  ): Promise<{ followersCount: number; followingCount: number }> {
    throw new Error('Not implemented');
  }
}

// Export singleton instance
export const followService = new FollowService();
