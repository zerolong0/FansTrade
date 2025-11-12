import request from 'supertest';
import { app } from '../../src/index';
import { prisma } from '../../src/config/database';

describe('Follow API Integration Tests', () => {
  let authToken: string;
  let userId: string;
  let traderId: string;
  let trader2Id: string;

  // Setup: Create test users
  beforeAll(async () => {
    // Create main user (follower)
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'follower@test.com',
        username: 'follower',
        password: 'password123',
      });

    authToken = registerRes.body.token;
    userId = registerRes.body.user.id;

    // Create trader 1
    const trader1Res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'trader1@test.com',
        username: 'trader1',
        password: 'password123',
      });
    traderId = trader1Res.body.user.id;

    // Create trader 2
    const trader2Res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'trader2@test.com',
        username: 'trader2',
        password: 'password123',
      });
    trader2Id = trader2Res.body.user.id;
  });

  // Cleanup: Delete test data
  afterAll(async () => {
    await prisma.follow.deleteMany({
      where: {
        OR: [
          { followerId: userId },
          { traderId: traderId },
          { traderId: trader2Id },
        ],
      },
    });

    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['follower@test.com', 'trader1@test.com', 'trader2@test.com'],
        },
      },
    });

    await prisma.$disconnect();
  });

  describe('POST /api/follow/:userId', () => {
    it('should follow a user successfully', async () => {
      const res = await request(app)
        .post(`/api/follow/${traderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send();

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Successfully followed user');
      expect(res.body.follow.traderId).toBe(traderId);
      expect(res.body.trader.username).toBe('trader1');
    });

    it('should return 400 when trying to follow yourself', async () => {
      const res = await request(app)
        .post(`/api/follow/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send();

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Cannot follow yourself');
    });

    it('should return 400 when already following', async () => {
      const res = await request(app)
        .post(`/api/follow/${traderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send();

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Already following this user');
    });

    it('should follow with custom config', async () => {
      const res = await request(app)
        .post(`/api/follow/${trader2Id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          config: {
            autoNotify: true,
            symbolsFilter: ['BTC', 'ETH'],
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.follow.config.autoNotify).toBe(true);
      expect(res.body.follow.config.symbolsFilter).toEqual(['BTC', 'ETH']);
    });
  });

  describe('GET /api/follow/following', () => {
    it('should return list of users I am following', async () => {
      const res = await request(app)
        .get('/api/follow/following')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.following).toBeInstanceOf(Array);
      expect(res.body.following.length).toBe(2); // Following trader1 and trader2
      expect(res.body.total).toBe(2);
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/api/follow/following?limit=1&offset=0')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.following.length).toBe(1);
      expect(res.body.limit).toBe(1);
      expect(res.body.offset).toBe(0);
    });
  });

  describe('GET /api/follow/followers', () => {
    it('should return list of my followers', async () => {
      const res = await request(app)
        .get('/api/follow/followers')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.followers).toBeInstanceOf(Array);
      expect(res.body.total).toBe(0); // No one following the main user
    });
  });

  describe('GET /api/follow/check/:userId', () => {
    it('should return true when following', async () => {
      const res = await request(app)
        .get(`/api/follow/check/${traderId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.isFollowing).toBe(true);
    });

    it('should return false when not following', async () => {
      // Create a new user that we're not following
      const newUserRes = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@test.com',
          username: 'newuser',
          password: 'password123',
        });

      const newUserId = newUserRes.body.user.id;

      const res = await request(app)
        .get(`/api/follow/check/${newUserId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.isFollowing).toBe(false);

      // Cleanup
      await prisma.user.delete({ where: { id: newUserId } });
    });
  });

  describe('GET /api/follow/stats/:userId', () => {
    it('should return follow statistics', async () => {
      const res = await request(app)
        .get(`/api/follow/stats/${traderId}`);

      expect(res.status).toBe(200);
      expect(res.body.userId).toBe(traderId);
      expect(res.body.followersCount).toBe(1); // Followed by main user
      expect(res.body.followingCount).toBe(0);
    });
  });

  describe('DELETE /api/follow/:userId', () => {
    it('should unfollow a user successfully', async () => {
      const res = await request(app)
        .delete(`/api/follow/${traderId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Successfully unfollowed user');
    });

    it('should be idempotent - no error when unfollowing again', async () => {
      const res = await request(app)
        .delete(`/api/follow/${traderId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
    });
  });
});
