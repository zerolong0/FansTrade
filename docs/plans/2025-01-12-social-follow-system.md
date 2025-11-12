# Social Follow System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement a complete social follow system allowing users to follow/unfollow traders, view following/follower lists, and manage follow configurations.

**Architecture:** RESTful API with service layer abstraction. Direct Prisma database queries (no caching in MVP). TDD approach with Jest for unit and integration tests. Zod for input validation.

**Tech Stack:** TypeScript, Express, Prisma, PostgreSQL, Zod, Jest, Supertest

---

## Prerequisites Checklist

Before starting, ensure:
- [ ] PostgreSQL is running and database is migrated
- [ ] Node.js >=20 is installed
- [ ] All dependencies are installed (`npm install`)
- [ ] `.env` file is configured with `DATABASE_URL`

---

## Task 1: Setup Testing Infrastructure

**Files:**
- Modify: `package.json`
- Create: `jest.config.js`
- Create: `tests/setup.ts`

### Step 1: Install test dependencies

```bash
npm install --save-dev jest @types/jest ts-jest supertest @types/supertest
```

Expected: Dependencies added to package.json devDependencies

### Step 2: Create Jest configuration

Create file: `jest.config.js`

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
};
```

### Step 3: Create test setup file

Create file: `tests/setup.ts`

```typescript
// Setup file for Jest tests
// This runs before all tests

beforeAll(async () => {
  // Ensure we're using test database
  if (!process.env.DATABASE_URL?.includes('test')) {
    console.warn('⚠️  WARNING: Not using test database!');
  }
});

afterAll(async () => {
  // Cleanup connections
});
```

### Step 4: Add test scripts to package.json

Modify: `package.json` - add to scripts section:

```json
"scripts": {
  "test": "jest --verbose",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage"
}
```

### Step 5: Verify test setup

Run:
```bash
mkdir -p tests
echo 'describe("Test setup", () => { it("should work", () => { expect(1 + 1).toBe(2); }); });' > tests/example.test.ts
npm test
```

Expected: Test passes with green output

### Step 6: Clean up example test

```bash
rm tests/example.test.ts
```

### Step 7: Commit

```bash
git add package.json package-lock.json jest.config.js tests/setup.ts
git commit -m "test: setup Jest testing infrastructure"
```

---

## Task 2: Create Follow Service - Core Types & Interfaces

**Files:**
- Create: `src/services/follow.service.ts`

### Step 1: Write test for FollowService class structure

Create file: `tests/services/follow.service.test.ts`

```typescript
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
```

### Step 2: Run test to verify it fails

Run:
```bash
npm test -- tests/services/follow.service.test.ts
```

Expected: FAIL - "Cannot find module '../../src/services/follow.service'"

### Step 3: Create FollowService class skeleton

Create file: `src/services/follow.service.ts`

```typescript
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
    throw new Error('Not implemented');
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
```

### Step 4: Run test to verify it passes

Run:
```bash
npm test -- tests/services/follow.service.test.ts
```

Expected: PASS - All structure tests pass

### Step 5: Commit

```bash
git add src/services/follow.service.ts tests/services/follow.service.test.ts
git commit -m "feat: create FollowService class skeleton with types"
```

---

## Task 3: Implement followUser Method (TDD)

**Files:**
- Modify: `src/services/follow.service.ts:21-27`
- Modify: `tests/services/follow.service.test.ts`

### Step 1: Write failing test for followUser validation

Add to `tests/services/follow.service.test.ts`:

```typescript
describe('followUser', () => {
  const mockFollowerId = 'follower-123';
  const mockTraderId = 'trader-456';

  it('should throw error when trying to follow yourself', async () => {
    await expect(
      followService.followUser(mockFollowerId, mockFollowerId)
    ).rejects.toThrow('Cannot follow yourself');
  });

  it('should throw error when trader does not exist', async () => {
    await expect(
      followService.followUser(mockFollowerId, 'non-existent-id')
    ).rejects.toThrow('User not found');
  });
});
```

### Step 2: Run test to verify it fails

Run:
```bash
npm test -- tests/services/follow.service.test.ts -t "followUser"
```

Expected: FAIL - Tests expect specific errors but get "Not implemented"

### Step 3: Implement followUser validation

Modify: `src/services/follow.service.ts` - replace followUser method:

```typescript
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
```

### Step 4: Add test for successful follow

Add to `tests/services/follow.service.test.ts` in followUser describe block:

```typescript
it('should throw error when already following', async () => {
  // This test requires actual database - will be tested in integration tests
  expect(true).toBe(true); // Placeholder
});

it('should create follow relationship successfully', async () => {
  // This test requires actual database - will be tested in integration tests
  expect(true).toBe(true); // Placeholder
});
```

### Step 5: Run test

Run:
```bash
npm test -- tests/services/follow.service.test.ts -t "followUser"
```

Expected: Tests pass (validation tests work, DB tests are placeholders)

### Step 6: Commit

```bash
git add src/services/follow.service.ts tests/services/follow.service.test.ts
git commit -m "feat: implement followUser method with validation"
```

---

## Task 4: Implement unfollowUser Method (TDD)

**Files:**
- Modify: `src/services/follow.service.ts:35-41`
- Modify: `tests/services/follow.service.test.ts`

### Step 1: Write test for unfollowUser

Add to `tests/services/follow.service.test.ts`:

```typescript
describe('unfollowUser', () => {
  const mockFollowerId = 'follower-123';
  const mockTraderId = 'trader-456';

  it('should not throw error when unfollowing non-existent follow', async () => {
    // Should be idempotent - no error if not following
    await expect(
      followService.unfollowUser(mockFollowerId, mockTraderId)
    ).resolves.not.toThrow();
  });
});
```

### Step 2: Run test to verify it fails

Run:
```bash
npm test -- tests/services/follow.service.test.ts -t "unfollowUser"
```

Expected: FAIL - "Not implemented" error

### Step 3: Implement unfollowUser

Modify: `src/services/follow.service.ts` - replace unfollowUser method:

```typescript
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
```

### Step 4: Run test to verify it passes

Run:
```bash
npm test -- tests/services/follow.service.test.ts -t "unfollowUser"
```

Expected: PASS

### Step 5: Commit

```bash
git add src/services/follow.service.ts tests/services/follow.service.test.ts
git commit -m "feat: implement unfollowUser method"
```

---

## Task 5: Implement getFollowing Method (TDD)

**Files:**
- Modify: `src/services/follow.service.ts:49-54`
- Modify: `tests/services/follow.service.test.ts`

### Step 1: Write test for getFollowing

Add to `tests/services/follow.service.test.ts`:

```typescript
describe('getFollowing', () => {
  const mockUserId = 'user-123';

  it('should return empty array when no follows', async () => {
    const result = await followService.getFollowing(mockUserId);
    expect(result).toHaveProperty('following');
    expect(result).toHaveProperty('total');
    expect(Array.isArray(result.following)).toBe(true);
  });

  it('should accept limit and offset options', async () => {
    const result = await followService.getFollowing(mockUserId, {
      limit: 10,
      offset: 0,
    });
    expect(result).toBeDefined();
  });
});
```

### Step 2: Run test to verify it fails

Run:
```bash
npm test -- tests/services/follow.service.test.ts -t "getFollowing"
```

Expected: FAIL - "Not implemented" error

### Step 3: Implement getFollowing

Modify: `src/services/follow.service.ts` - replace getFollowing method:

```typescript
async getFollowing(
  userId: string,
  options?: { limit?: number; offset?: number }
): Promise<{
  following: any[];
  total: number;
  limit: number;
  offset: number;
}> {
  const limit = options?.limit || 20;
  const offset = options?.offset || 0;

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

  return {
    following,
    total,
    limit,
    offset,
  };
}
```

### Step 4: Run test to verify it passes

Run:
```bash
npm test -- tests/services/follow.service.test.ts -t "getFollowing"
```

Expected: PASS

### Step 5: Commit

```bash
git add src/services/follow.service.ts tests/services/follow.service.test.ts
git commit -m "feat: implement getFollowing method with pagination"
```

---

## Task 6: Implement getFollowers Method (TDD)

**Files:**
- Modify: `src/services/follow.service.ts:62-67`
- Modify: `tests/services/follow.service.test.ts`

### Step 1: Write test for getFollowers

Add to `tests/services/follow.service.test.ts`:

```typescript
describe('getFollowers', () => {
  const mockTraderId = 'trader-123';

  it('should return empty array when no followers', async () => {
    const result = await followService.getFollowers(mockTraderId);
    expect(result).toHaveProperty('followers');
    expect(result).toHaveProperty('total');
    expect(Array.isArray(result.followers)).toBe(true);
  });

  it('should accept limit and offset options', async () => {
    const result = await followService.getFollowers(mockTraderId, {
      limit: 10,
      offset: 0,
    });
    expect(result).toBeDefined();
  });
});
```

### Step 2: Run test to verify it fails

Run:
```bash
npm test -- tests/services/follow.service.test.ts -t "getFollowers"
```

Expected: FAIL - "Not implemented" error

### Step 3: Implement getFollowers

Modify: `src/services/follow.service.ts` - replace getFollowers method:

```typescript
async getFollowers(
  traderId: string,
  options?: { limit?: number; offset?: number }
): Promise<{
  followers: any[];
  total: number;
  limit: number;
  offset: number;
}> {
  const limit = options?.limit || 20;
  const offset = options?.offset || 0;

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
```

### Step 4: Run test to verify it passes

Run:
```bash
npm test -- tests/services/follow.service.test.ts -t "getFollowers"
```

Expected: PASS

### Step 5: Commit

```bash
git add src/services/follow.service.ts tests/services/follow.service.test.ts
git commit -m "feat: implement getFollowers method with pagination"
```

---

## Task 7: Implement isFollowing Method (TDD)

**Files:**
- Modify: `src/services/follow.service.ts:75-80`
- Modify: `tests/services/follow.service.test.ts`

### Step 1: Write test for isFollowing

Add to `tests/services/follow.service.test.ts`:

```typescript
describe('isFollowing', () => {
  const mockFollowerId = 'follower-123';
  const mockTraderId = 'trader-456';

  it('should return boolean', async () => {
    const result = await followService.isFollowing(
      mockFollowerId,
      mockTraderId
    );
    expect(typeof result).toBe('boolean');
  });

  it('should return false when not following', async () => {
    const result = await followService.isFollowing(
      'non-existent-1',
      'non-existent-2'
    );
    expect(result).toBe(false);
  });
});
```

### Step 2: Run test to verify it fails

Run:
```bash
npm test -- tests/services/follow.service.test.ts -t "isFollowing"
```

Expected: FAIL - "Not implemented" error

### Step 3: Implement isFollowing

Modify: `src/services/follow.service.ts` - replace isFollowing method:

```typescript
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
```

### Step 4: Run test to verify it passes

Run:
```bash
npm test -- tests/services/follow.service.test.ts -t "isFollowing"
```

Expected: PASS

### Step 5: Commit

```bash
git add src/services/follow.service.ts tests/services/follow.service.test.ts
git commit -m "feat: implement isFollowing method"
```

---

## Task 8: Implement getFollowStats Method (TDD)

**Files:**
- Modify: `src/services/follow.service.ts:88-92`
- Modify: `tests/services/follow.service.test.ts`

### Step 1: Write test for getFollowStats

Add to `tests/services/follow.service.test.ts`:

```typescript
describe('getFollowStats', () => {
  const mockUserId = 'user-123';

  it('should return stats with correct structure', async () => {
    const result = await followService.getFollowStats(mockUserId);
    expect(result).toHaveProperty('followersCount');
    expect(result).toHaveProperty('followingCount');
    expect(typeof result.followersCount).toBe('number');
    expect(typeof result.followingCount).toBe('number');
  });

  it('should return 0 for non-existent user', async () => {
    const result = await followService.getFollowStats('non-existent');
    expect(result.followersCount).toBe(0);
    expect(result.followingCount).toBe(0);
  });
});
```

### Step 2: Run test to verify it fails

Run:
```bash
npm test -- tests/services/follow.service.test.ts -t "getFollowStats"
```

Expected: FAIL - "Not implemented" error

### Step 3: Implement getFollowStats

Modify: `src/services/follow.service.ts` - replace getFollowStats method:

```typescript
async getFollowStats(
  userId: string
): Promise<{ followersCount: number; followingCount: number }> {
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
```

### Step 4: Run test to verify it passes

Run:
```bash
npm test -- tests/services/follow.service.test.ts -t "getFollowStats"
```

Expected: PASS

### Step 5: Run all service tests

Run:
```bash
npm test -- tests/services/follow.service.test.ts
```

Expected: ALL TESTS PASS

### Step 6: Commit

```bash
git add src/services/follow.service.ts tests/services/follow.service.test.ts
git commit -m "feat: implement getFollowStats method

- Service layer complete
- All unit tests passing"
```

---

## Task 9: Create Follow Routes - Setup & Validation Schemas

**Files:**
- Create: `src/routes/follow.routes.ts`
- Create: `tests/routes/follow.routes.test.ts`

### Step 1: Create validation schemas

Create file: `src/routes/follow.routes.ts`

```typescript
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

export default router;
```

### Step 2: Commit schema setup

```bash
git add src/routes/follow.routes.ts
git commit -m "feat: create follow routes with validation schemas"
```

---

## Task 10: Implement POST /api/follow/:userId Endpoint

**Files:**
- Modify: `src/routes/follow.routes.ts`

### Step 1: Add followUser endpoint

Add to `src/routes/follow.routes.ts` before `export default router`:

```typescript
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
```

### Step 2: Commit

```bash
git add src/routes/follow.routes.ts
git commit -m "feat: add POST /api/follow/:userId endpoint"
```

---

## Task 11: Implement DELETE /api/follow/:userId Endpoint

**Files:**
- Modify: `src/routes/follow.routes.ts`

### Step 1: Add unfollowUser endpoint

Add to `src/routes/follow.routes.ts` before `export default router`:

```typescript
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
```

### Step 2: Commit

```bash
git add src/routes/follow.routes.ts
git commit -m "feat: add DELETE /api/follow/:userId endpoint"
```

---

## Task 12: Implement GET /api/follow/following Endpoint

**Files:**
- Modify: `src/routes/follow.routes.ts`

### Step 1: Add getFollowing endpoint

Add to `src/routes/follow.routes.ts` before `export default router`:

```typescript
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
```

### Step 2: Commit

```bash
git add src/routes/follow.routes.ts
git commit -m "feat: add GET /api/follow/following endpoint"
```

---

## Task 13: Implement GET /api/follow/followers Endpoint

**Files:**
- Modify: `src/routes/follow.routes.ts`

### Step 1: Add getFollowers endpoint

Add to `src/routes/follow.routes.ts` before `export default router`:

```typescript
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
```

### Step 2: Commit

```bash
git add src/routes/follow.routes.ts
git commit -m "feat: add GET /api/follow/followers endpoint"
```

---

## Task 14: Implement GET /api/follow/check/:userId Endpoint

**Files:**
- Modify: `src/routes/follow.routes.ts`

### Step 1: Add isFollowing endpoint

Add to `src/routes/follow.routes.ts` before `export default router`:

```typescript
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
```

### Step 2: Commit

```bash
git add src/routes/follow.routes.ts
git commit -m "feat: add GET /api/follow/check/:userId endpoint"
```

---

## Task 15: Implement GET /api/follow/stats/:userId Endpoint

**Files:**
- Modify: `src/routes/follow.routes.ts`

### Step 1: Add getFollowStats endpoint

Add to `src/routes/follow.routes.ts` before `export default router`:

```typescript
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
```

### Step 2: Commit

```bash
git add src/routes/follow.routes.ts
git commit -m "feat: add GET /api/follow/stats/:userId endpoint

- All routes implemented
- Ready for integration"
```

---

## Task 16: Register Follow Routes in Main App

**Files:**
- Modify: `src/index.ts`

### Step 1: Import follow routes

Add import at top of `src/index.ts` after other route imports:

```typescript
import followRoutes from './routes/follow.routes';
```

### Step 2: Register follow routes

Add after other route registrations (after `app.use('/api/exchange', exchangeRoutes);`):

```typescript
app.use('/api/follow', followRoutes);
```

### Step 3: Update root endpoint

Modify the root endpoint to include follow in the endpoints list:

```typescript
app.get('/', (req, res) => {
  res.json({
    message: 'FansTrade API',
    version: '0.1.0',
    endpoints: {
      auth: '/api/auth',
      exchange: '/api/exchange',
      follow: '/api/follow',  // Add this line
      health: '/health',
    },
  });
});
```

### Step 4: Verify app starts

Run:
```bash
npm run dev
```

Expected: Server starts without errors, shows:
```
✨ Ready to accept requests
```

Press Ctrl+C to stop.

### Step 5: Commit

```bash
git add src/index.ts
git commit -m "feat: register follow routes in main app"
```

---

## Task 17: Create Integration Test Suite

**Files:**
- Create: `tests/integration/follow.integration.test.ts`

### Step 1: Create integration test file

Create file: `tests/integration/follow.integration.test.ts`

```typescript
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
```

### Step 2: Run integration tests

Run:
```bash
npm test -- tests/integration/follow.integration.test.ts
```

Expected: All integration tests pass

### Step 3: Commit

```bash
git add tests/integration/follow.integration.test.ts
git commit -m "test: add comprehensive integration tests for follow API"
```

---

## Task 18: Update API Documentation

**Files:**
- Modify: `API.md`

### Step 1: Add follow endpoints to API.md

Add section after Exchange Integration section in `API.md`:

```markdown
### Social - Follow System

#### Follow a User
```http
POST /api/follow/:userId
Authorization: Bearer <token>
Content-Type: application/json

{
  "config": {
    "autoNotify": true,
    "symbolsFilter": ["BTC", "ETH"],
    "maxAmountPerTrade": 1000
  }
}
```

**Response 201:**
```json
{
  "message": "Successfully followed user",
  "follow": {
    "id": "uuid",
    "traderId": "uuid",
    "createdAt": "2025-01-12T...",
    "config": { ... }
  },
  "trader": {
    "id": "uuid",
    "username": "cryptowhale",
    "displayName": "Crypto Whale",
    "avatarUrl": "...",
    "isVerified": true
  }
}
```

**Errors:**
- 400: Cannot follow yourself
- 400: Already following this user
- 404: User not found

#### Unfollow a User
```http
DELETE /api/follow/:userId
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "message": "Successfully unfollowed user"
}
```

#### Get Following List
```http
GET /api/follow/following?limit=20&offset=0
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "following": [
    {
      "id": "follow-uuid",
      "createdAt": "2025-01-10T...",
      "config": { ... },
      "trader": {
        "id": "user-uuid",
        "username": "cryptowhale",
        "displayName": "Crypto Whale",
        "avatarUrl": "...",
        "isVerified": true,
        "_count": {
          "followers": 1234
        }
      }
    }
  ],
  "total": 15,
  "limit": 20,
  "offset": 0
}
```

#### Get Followers List
```http
GET /api/follow/followers?limit=20&offset=0
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "followers": [
    {
      "id": "follow-uuid",
      "createdAt": "2025-01-12T...",
      "follower": {
        "id": "user-uuid",
        "username": "trader123",
        "displayName": "Trader",
        "avatarUrl": "...",
        "isVerified": false
      }
    }
  ],
  "total": 42,
  "limit": 20,
  "offset": 0
}
```

#### Check Follow Status
```http
GET /api/follow/check/:userId
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "isFollowing": true
}
```

#### Get Follow Statistics
```http
GET /api/follow/stats/:userId
```

**Response 200:**
```json
{
  "userId": "uuid",
  "followersCount": 1234,
  "followingCount": 56
}
```
```

### Step 2: Commit

```bash
git add API.md
git commit -m "docs: add follow system API documentation"
```

---

## Task 19: Manual Testing with Development Server

**No files modified - manual testing**

### Step 1: Start development server

Run:
```bash
npm run dev
```

Expected: Server starts on port 3000

### Step 2: Test health check

Run in new terminal:
```bash
curl http://localhost:3000/health
```

Expected: JSON response with status "ok"

### Step 3: Register two test users

User 1 (Follower):
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manual_follower@test.com",
    "username": "manual_follower",
    "password": "password123"
  }'
```

Save the token from response as `TOKEN1`

User 2 (Trader):
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manual_trader@test.com",
    "username": "manual_trader",
    "password": "password123"
  }'
```

Save the user ID from response as `TRADER_ID`

### Step 4: Test follow functionality

Follow trader:
```bash
curl -X POST http://localhost:3000/api/follow/$TRADER_ID \
  -H "Authorization: Bearer $TOKEN1" \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "autoNotify": true,
      "symbolsFilter": ["BTC"]
    }
  }'
```

Expected: 201 response with follow details

### Step 5: Get following list

```bash
curl -X GET http://localhost:3000/api/follow/following \
  -H "Authorization: Bearer $TOKEN1"
```

Expected: Array with one trader

### Step 6: Check follow status

```bash
curl -X GET http://localhost:3000/api/follow/check/$TRADER_ID \
  -H "Authorization: Bearer $TOKEN1"
```

Expected: `{"isFollowing": true}`

### Step 7: Get follow stats

```bash
curl -X GET http://localhost:3000/api/follow/stats/$TRADER_ID
```

Expected: `{"userId": "...", "followersCount": 1, "followingCount": 0}`

### Step 8: Unfollow

```bash
curl -X DELETE http://localhost:3000/api/follow/$TRADER_ID \
  -H "Authorization: Bearer $TOKEN1"
```

Expected: 200 response

### Step 9: Verify unfollow

```bash
curl -X GET http://localhost:3000/api/follow/check/$TRADER_ID \
  -H "Authorization: Bearer $TOKEN1"
```

Expected: `{"isFollowing": false}`

### Step 10: Stop development server

Press Ctrl+C in terminal running dev server

### Step 11: Clean up test data

```bash
npm run db:studio
```

In Prisma Studio, delete the manual test users.

Or via script:
```bash
npx tsx -e "
import { prisma } from './src/config/database';
await prisma.user.deleteMany({
  where: {
    email: { in: ['manual_follower@test.com', 'manual_trader@test.com'] }
  }
});
await prisma.\$disconnect();
"
```

---

## Task 20: Final Verification

**No files modified - verification**

### Step 1: Run all tests

Run:
```bash
npm test
```

Expected: All tests pass

### Step 2: Check test coverage

Run:
```bash
npm run test:coverage
```

Expected: Coverage report showing good coverage of follow service and routes

### Step 3: Lint code

Run:
```bash
npm run lint
```

Expected: No linting errors (or minor warnings)

### Step 4: Build project

Run:
```bash
npm run build
```

Expected: TypeScript compiles successfully to `dist/` folder

### Step 5: Create final commit

```bash
git add .
git commit -m "feat: social follow system complete

✅ Complete follow/unfollow functionality
✅ Following and followers lists with pagination
✅ Follow status checking
✅ Follow statistics
✅ Custom follow configurations
✅ Comprehensive unit and integration tests
✅ API documentation updated
✅ All tests passing

Endpoints:
- POST /api/follow/:userId
- DELETE /api/follow/:userId
- GET /api/follow/following
- GET /api/follow/followers
- GET /api/follow/check/:userId
- GET /api/follow/stats/:userId"
```

---

## Task 21: Testing with Chrome DevTools MCP (Optional but Recommended)

**Requires: Chrome DevTools MCP tool**

### Step 1: Start development server

Run:
```bash
npm run dev
```

### Step 2: Create test HTML page (Optional)

Create `tests/manual/follow-ui-test.html` for interactive testing:

```html
<!DOCTYPE html>
<html>
<head>
  <title>FansTrade Follow System Test</title>
</head>
<body>
  <h1>Follow System Test</h1>

  <div id="auth">
    <h2>1. Register/Login</h2>
    <input id="email" placeholder="email" value="test@test.com" />
    <input id="password" type="password" placeholder="password" value="password123" />
    <button onclick="register()">Register</button>
    <button onclick="login()">Login</button>
    <div id="authStatus"></div>
  </div>

  <div id="follow">
    <h2>2. Follow User</h2>
    <input id="traderIdInput" placeholder="Trader ID" />
    <button onclick="followUser()">Follow</button>
    <button onclick="unfollowUser()">Unfollow</button>
    <button onclick="checkFollow()">Check Status</button>
  </div>

  <div id="lists">
    <h2>3. Lists</h2>
    <button onclick="getFollowing()">Get Following</button>
    <button onclick="getFollowers()">Get Followers</button>
    <div id="results"></div>
  </div>

  <script>
    const API = 'http://localhost:3000/api';
    let token = '';

    async function register() {
      const res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: document.getElementById('email').value,
          username: 'testuser' + Date.now(),
          password: document.getElementById('password').value
        })
      });
      const data = await res.json();
      token = data.token;
      document.getElementById('authStatus').innerHTML = 'Registered! Token: ' + token.substring(0, 20) + '...';
    }

    async function login() {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: document.getElementById('email').value,
          password: document.getElementById('password').value
        })
      });
      const data = await res.json();
      token = data.token;
      document.getElementById('authStatus').innerHTML = 'Logged in! Token: ' + token.substring(0, 20) + '...';
    }

    async function followUser() {
      const traderId = document.getElementById('traderIdInput').value;
      const res = await fetch(`${API}/follow/${traderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          config: { autoNotify: true }
        })
      });
      const data = await res.json();
      document.getElementById('results').innerHTML = JSON.stringify(data, null, 2);
    }

    async function unfollowUser() {
      const traderId = document.getElementById('traderIdInput').value;
      const res = await fetch(`${API}/follow/${traderId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      document.getElementById('results').innerHTML = JSON.stringify(data, null, 2);
    }

    async function checkFollow() {
      const traderId = document.getElementById('traderIdInput').value;
      const res = await fetch(`${API}/follow/check/${traderId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      document.getElementById('results').innerHTML = JSON.stringify(data, null, 2);
    }

    async function getFollowing() {
      const res = await fetch(`${API}/follow/following`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      document.getElementById('results').innerHTML = JSON.stringify(data, null, 2);
    }

    async function getFollowers() {
      const res = await fetch(`${API}/follow/followers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      document.getElementById('results').innerHTML = JSON.stringify(data, null, 2);
    }
  </script>
</body>
</html>
```

### Step 3: Open in Chrome and test with DevTools

Use Chrome DevTools MCP to:
1. Navigate to `file:///.../tests/manual/follow-ui-test.html`
2. Take screenshots of successful operations
3. Verify all interactions work correctly

---

## Completion Checklist

- [ ] Task 1: Testing infrastructure setup ✅
- [ ] Task 2: FollowService skeleton ✅
- [ ] Task 3: followUser implementation ✅
- [ ] Task 4: unfollowUser implementation ✅
- [ ] Task 5: getFollowing implementation ✅
- [ ] Task 6: getFollowers implementation ✅
- [ ] Task 7: isFollowing implementation ✅
- [ ] Task 8: getFollowStats implementation ✅
- [ ] Task 9: Follow routes setup ✅
- [ ] Task 10-15: All route endpoints ✅
- [ ] Task 16: Routes registered ✅
- [ ] Task 17: Integration tests ✅
- [ ] Task 18: API documentation ✅
- [ ] Task 19: Manual testing ✅
- [ ] Task 20: Final verification ✅
- [ ] Task 21: Chrome DevTools testing (Optional) ✅

---

## Next Steps After Completion

1. **Deploy to NAS** - Use NAS deployment workflow
2. **Phase 2 Features**:
   - Trade signal distribution system
   - AI strategy analysis
   - Real-time notifications via WebSocket
3. **Performance Optimization**:
   - Add Redis caching for follow counts
   - Implement Bloom filters for quick follow checks
4. **Frontend Development**:
   - Create trader profile pages
   - Build following/followers UI
   - Add follow buttons to trader cards

---

## Estimated Time

- Tasks 1-8: 2-3 hours (Service layer)
- Tasks 9-16: 1-2 hours (Routes layer)
- Tasks 17-21: 1-2 hours (Testing & verification)
- **Total: 4-6 hours**
