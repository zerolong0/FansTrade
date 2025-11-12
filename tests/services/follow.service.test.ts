import { FollowService } from '../../src/services/follow.service';
import { prisma } from '../../src/config/database';

// Mock Prisma
jest.mock('../../src/config/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    follow: {
      findUnique: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

describe('FollowService', () => {
  let followService: FollowService;

  beforeEach(() => {
    followService = new FollowService();
    jest.clearAllMocks();
  });

  describe('Class structure', () => {
    it('should be instantiable', () => {
      expect(followService).toBeInstanceOf(FollowService);
    });

    it('should have followUser method', () => {
      expect(typeof followService.followUser).toBe('function');
    });

    it('should have unfollowUser method', () => {
      expect(typeof followService.unfollowUser).toBe('function');
    });

    it('should have getFollowing method', () => {
      expect(typeof followService.getFollowing).toBe('function');
    });

    it('should have getFollowers method', () => {
      expect(typeof followService.getFollowers).toBe('function');
    });

    it('should have isFollowing method', () => {
      expect(typeof followService.isFollowing).toBe('function');
    });

    it('should have getFollowStats method', () => {
      expect(typeof followService.getFollowStats).toBe('function');
    });
  });

  describe('followUser', () => {
    const mockFollowerId = 'follower-123';
    const mockTraderId = 'trader-456';

    it('should throw error when trying to follow yourself', async () => {
      await expect(
        followService.followUser(mockFollowerId, mockFollowerId)
      ).rejects.toThrow('Cannot follow yourself');
    });

    it('should throw error when trader does not exist', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        followService.followUser(mockFollowerId, 'non-existent-id')
      ).rejects.toThrow('User not found');
    });

    it('should throw error when already following', async () => {
      const mockTrader = {
        id: mockTraderId,
        username: 'trader',
        displayName: 'Trader',
        avatarUrl: null,
        isVerified: false,
      };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockTrader);
      (prisma.follow.findUnique as jest.Mock).mockResolvedValue({ id: 'follow-123' });

      await expect(
        followService.followUser(mockFollowerId, mockTraderId)
      ).rejects.toThrow('Already following this user');
    });

    it('should create follow relationship successfully', async () => {
      const mockTrader = {
        id: mockTraderId,
        username: 'trader',
        displayName: 'Trader',
        avatarUrl: null,
        isVerified: false,
      };
      const mockFollow = {
        id: 'follow-123',
        followerId: mockFollowerId,
        traderId: mockTraderId,
        createdAt: new Date(),
        config: {},
        trader: mockTrader,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockTrader);
      (prisma.follow.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.follow.create as jest.Mock).mockResolvedValue(mockFollow);

      const result = await followService.followUser(mockFollowerId, mockTraderId);

      expect(result).toEqual(mockFollow);
      expect(prisma.follow.create).toHaveBeenCalledWith({
        data: {
          followerId: mockFollowerId,
          traderId: mockTraderId,
          config: {},
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
    });
  });

  describe('unfollowUser', () => {
    const mockFollowerId = 'follower-123';
    const mockTraderId = 'trader-456';

    it('should not throw error when unfollowing non-existent follow', async () => {
      (prisma.follow.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });

      await expect(
        followService.unfollowUser(mockFollowerId, mockTraderId)
      ).resolves.not.toThrow();
    });

    it('should successfully delete follow relationship', async () => {
      (prisma.follow.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

      await followService.unfollowUser(mockFollowerId, mockTraderId);

      expect(prisma.follow.deleteMany).toHaveBeenCalledWith({
        where: {
          followerId: mockFollowerId,
          traderId: mockTraderId,
        },
      });
    });
  });

  describe('getFollowing', () => {
    const mockUserId = 'user-123';

    it('should return empty array when no follows', async () => {
      (prisma.follow.count as jest.Mock).mockResolvedValue(0);
      (prisma.follow.findMany as jest.Mock).mockResolvedValue([]);

      const result = await followService.getFollowing(mockUserId);

      expect(result).toHaveProperty('following');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.following)).toBe(true);
      expect(result.total).toBe(0);
      expect(result.following).toEqual([]);
    });

    it('should accept limit and offset options', async () => {
      (prisma.follow.count as jest.Mock).mockResolvedValue(5);
      (prisma.follow.findMany as jest.Mock).mockResolvedValue([]);

      const result = await followService.getFollowing(mockUserId, {
        limit: 10,
        offset: 0,
      });

      expect(result).toBeDefined();
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(0);
      expect(prisma.follow.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 0,
        })
      );
    });

    it('should return following list with trader info', async () => {
      const mockFollowing = [
        {
          id: 'follow-1',
          createdAt: new Date(),
          config: {},
          trader: {
            id: 'trader-1',
            username: 'trader1',
            displayName: 'Trader 1',
            avatarUrl: null,
            isVerified: true,
            _count: { followers: 10 },
          },
        },
      ];

      (prisma.follow.count as jest.Mock).mockResolvedValue(1);
      (prisma.follow.findMany as jest.Mock).mockResolvedValue(mockFollowing);

      const result = await followService.getFollowing(mockUserId);

      expect(result.following).toEqual(mockFollowing);
      expect(result.total).toBe(1);
    });
  });
});
