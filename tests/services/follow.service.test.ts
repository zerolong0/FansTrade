import { FollowService } from '../../src/services/follow.service';

describe('FollowService', () => {
  let followService: FollowService;

  beforeEach(() => {
    followService = new FollowService();
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
});
