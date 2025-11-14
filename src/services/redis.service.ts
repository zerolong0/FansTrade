/**
 * Redis Service - 缓存服务
 * 用于缓存 Binance 市场数据、交易对信息等
 */

import { createClient, RedisClientType } from 'redis';

class RedisService {
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;

  /**
   * 初始化 Redis 连接
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

      this.client = createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              console.error('❌ Redis reconnection failed after 10 attempts');
              return new Error('Redis reconnection limit reached');
            }
            return Math.min(retries * 100, 3000);
          },
        },
      });

      this.client.on('error', (err) => {
        console.error('❌ Redis Client Error:', err);
      });

      this.client.on('connect', () => {
        console.log('✅ Redis connected');
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        console.log('⚠️  Redis disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      console.error('❌ Redis connection error:', error);
      // 不抛出错误，允许系统在没有 Redis 的情况下运行（降级到无缓存模式）
    }
  }

  /**
   * 获取值
   */
  async get(key: string): Promise<string | null> {
    if (!this.isConnected || !this.client) {
      return null;
    }

    try {
      return await this.client.get(key);
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  /**
   * 设置值（带过期时间）
   */
  async setex(key: string, seconds: number, value: string): Promise<void> {
    if (!this.isConnected || !this.client) {
      return;
    }

    try {
      await this.client.setEx(key, seconds, value);
    } catch (error) {
      console.error('Redis setex error:', error);
    }
  }

  /**
   * 设置值（不过期）
   */
  async set(key: string, value: string): Promise<void> {
    if (!this.isConnected || !this.client) {
      return;
    }

    try {
      await this.client.set(key, value);
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  /**
   * 删除键
   */
  async del(key: string): Promise<void> {
    if (!this.isConnected || !this.client) {
      return;
    }

    try {
      await this.client.del(key);
    } catch (error) {
      console.error('Redis del error:', error);
    }
  }

  /**
   * 检查键是否存在
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis exists error:', error);
      return false;
    }
  }

  /**
   * 获取 TTL（剩余过期时间）
   */
  async ttl(key: string): Promise<number> {
    if (!this.isConnected || !this.client) {
      return -2;
    }

    try {
      return await this.client.ttl(key);
    } catch (error) {
      console.error('Redis ttl error:', error);
      return -2;
    }
  }

  /**
   * 关闭连接
   */
  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
      console.log('✅ Redis disconnected');
    }
  }

  /**
   * 检查连接状态
   */
  isReady(): boolean {
    return this.isConnected;
  }
}

// 单例导出
export const redis = new RedisService();
