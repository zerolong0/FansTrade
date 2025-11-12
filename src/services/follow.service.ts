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
 * User profile information
 */
export interface UserProfile {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  isVerified: boolean;
}

/**
 * Follow relationship with trader details
 */
export interface FollowResult {
  id: string;
  followerId: string;
  traderId: string;
  createdAt: Date;
  config: FollowConfig;
  trader: UserProfile;
}

/**
 * Paginated list of follows with trader details
 */
export interface PaginatedFollowing {
  following: Array<{
    id: string;
    createdAt: Date;
    config: FollowConfig;
    trader: UserProfile & {
      _count: {
        followers: number;
      };
    };
  }>;
  total: number;
  limit: number;
  offset: number;
}

/**
 * Paginated list of followers
 */
export interface PaginatedFollowers {
  followers: Array<{
    id: string;
    createdAt: Date;
    follower: UserProfile;
  }>;
  total: number;
  limit: number;
  offset: number;
}

/**
 * Follow statistics
 */
export interface FollowStats {
  followersCount: number;
  followingCount: number;
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
  ): Promise<FollowResult> {
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
        config: (config || {}) as any,
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

    // Type assertion to match FollowResult interface
    return {
      id: follow.id,
      followerId: follow.followerId,
      traderId: follow.traderId,
      createdAt: follow.createdAt,
      config: follow.config as FollowConfig,
      trader: follow.trader,
    };
  }

  /**
   * Unfollow a user
   */
  async unfollowUser(
    followerId: string,
    traderId: string
  ): Promise<void> {
    // Delete follow relationship (idempotent - no error if doesn't exist)
    await prisma.follow.deleteMany({
      where: {
        followerId,
        traderId,
      },
    });
  }

  /**
   * Get list of users that a user is following
   */
  async getFollowing(
    userId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<PaginatedFollowing> {
    const limit = Math.min(options?.limit || 20, 100); // Max 100
    const offset = Math.max(options?.offset || 0, 0);  // No negative

    // Get total count
    const total = await prisma.follow.count({
      where: { followerId: userId },
    });

    // Get following list with trader info
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      select: {
        id: true,
        createdAt: true,
        config: true,
        trader: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            isVerified: true,
            _count: {
              select: {
                followers: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    // Type assertion for config field
    const typedFollowing = following.map(item => ({
      ...item,
      config: item.config as FollowConfig,
    }));

    return {
      following: typedFollowing,
      total,
      limit,
      offset,
    };
  }

  /**
   * Get list of users following a user
   */
  async getFollowers(
    traderId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<PaginatedFollowers> {
    const limit = Math.min(options?.limit || 20, 100); // Max 100
    const offset = Math.max(options?.offset || 0, 0);  // No negative

    // Get total count
    const total = await prisma.follow.count({
      where: { traderId },
    });

    // Get followers list with follower info
    const followers = await prisma.follow.findMany({
      where: { traderId },
      select: {
        id: true,
        createdAt: true,
        follower: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            isVerified: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return {
      followers,
      total,
      limit,
      offset,
    };
  }

  /**
   * Check if a user is following another user
   */
  async isFollowing(
    followerId: string,
    traderId: string
  ): Promise<boolean> {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_traderId: {
          followerId,
          traderId,
        },
      },
    });

    return follow !== null;
  }

  /**
   * Get follow statistics for a user
   */
  async getFollowStats(
    userId: string
  ): Promise<FollowStats> {
    const [followersCount, followingCount] = await Promise.all([
      prisma.follow.count({
        where: { traderId: userId },
      }),
      prisma.follow.count({
        where: { followerId: userId },
      }),
    ]);

    return {
      followersCount,
      followingCount,
    };
  }
}

// Export singleton instance
export const followService = new FollowService();
