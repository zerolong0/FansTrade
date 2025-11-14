/**
 * Binance API Key Controller
 * 管理用户的 Binance API Key 绑定
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { encrypt } from '../services/crypto.service';
import { binanceService } from '../services/binance/binance.service';

const prisma = new PrismaClient();

/**
 * 绑定新的 API Key
 * POST /api/binance/api-keys
 */
export async function createApiKey(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { label, apiKey, apiSecret } = req.body;

    // 验证必填字段
    if (!apiKey || !apiSecret) {
      return res.status(400).json({ error: 'API Key and Secret are required' });
    }

    // 验证 API Key 有效性
    console.log('🔍 Validating API Key...');
    const isValid = await binanceService.validateApiKey(apiKey, apiSecret);

    if (!isValid) {
      return res.status(400).json({
        error: 'Invalid API Key or Secret. Please check your credentials.',
      });
    }

    // 检查是否已存在相同的 API Key
    const existingKey = await prisma.binanceApiKey.findFirst({
      where: {
        userId,
        apiKeyEncrypted: encrypt(apiKey),
      },
    });

    if (existingKey) {
      return res.status(400).json({
        error: 'This API Key is already registered',
      });
    }

    // 如果这是第一个 API Key，自动设为 active
    const existingCount = await prisma.binanceApiKey.count({
      where: { userId },
    });
    const isFirstKey = existingCount === 0;

    // 如果要设为 active，先把其他的设为 inactive
    if (isFirstKey) {
      await prisma.binanceApiKey.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false },
      });
    }

    // 加密并存储
    const encryptedKey = encrypt(apiKey);
    const encryptedSecret = encrypt(apiSecret);

    const newApiKey = await prisma.binanceApiKey.create({
      data: {
        userId,
        label: label || 'Default',
        apiKeyEncrypted: encryptedKey,
        apiSecretEncrypted: encryptedSecret,
        isActive: isFirstKey,
      },
      select: {
        id: true,
        label: true,
        isActive: true,
        createdAt: true,
        lastUsedAt: true,
      },
    });

    console.log(`✅ API Key created for user ${userId}`);

    res.status(201).json({
      message: 'API Key added successfully',
      apiKey: newApiKey,
    });
  } catch (error: any) {
    console.error('Create API Key error:', error);
    res.status(500).json({
      error: 'Failed to create API Key',
      details: error.message,
    });
  }
}

/**
 * 获取用户的所有 API Keys
 * GET /api/binance/api-keys
 */
export async function getApiKeys(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const apiKeys = await prisma.binanceApiKey.findMany({
      where: { userId },
      select: {
        id: true,
        label: true,
        isActive: true,
        createdAt: true,
        lastUsedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ apiKeys });
  } catch (error: any) {
    console.error('Get API Keys error:', error);
    res.status(500).json({
      error: 'Failed to get API Keys',
      details: error.message,
    });
  }
}

/**
 * 删除 API Key
 * DELETE /api/binance/api-keys/:id
 */
export async function deleteApiKey(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    // 验证 API Key 是否属于当前用户
    const apiKey = await prisma.binanceApiKey.findFirst({
      where: { id, userId },
    });

    if (!apiKey) {
      return res.status(404).json({ error: 'API Key not found' });
    }

    // 删除
    await prisma.binanceApiKey.delete({
      where: { id },
    });

    console.log(`✅ API Key deleted: ${id}`);

    res.json({ message: 'API Key deleted successfully' });
  } catch (error: any) {
    console.error('Delete API Key error:', error);
    res.status(500).json({
      error: 'Failed to delete API Key',
      details: error.message,
    });
  }
}

/**
 * 切换 API Key 激活状态
 * PUT /api/binance/api-keys/:id/toggle
 */
export async function toggleApiKey(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    // 验证 API Key 是否属于当前用户
    const apiKey = await prisma.binanceApiKey.findFirst({
      where: { id, userId },
    });

    if (!apiKey) {
      return res.status(404).json({ error: 'API Key not found' });
    }

    // 如果要激活这个 Key，先把其他的设为 inactive
    if (!apiKey.isActive) {
      await prisma.binanceApiKey.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false },
      });
    }

    // 切换状态
    const updatedKey = await prisma.binanceApiKey.update({
      where: { id },
      data: { isActive: !apiKey.isActive },
      select: {
        id: true,
        label: true,
        isActive: true,
        createdAt: true,
        lastUsedAt: true,
      },
    });

    console.log(`✅ API Key toggled: ${id} -> ${updatedKey.isActive}`);

    res.json({
      message: 'API Key status updated',
      apiKey: updatedKey,
    });
  } catch (error: any) {
    console.error('Toggle API Key error:', error);
    res.status(500).json({
      error: 'Failed to toggle API Key',
      details: error.message,
    });
  }
}

/**
 * 验证 API Key（不保存）
 * POST /api/binance/api-keys/validate
 */
export async function validateApiKey(req: Request, res: Response) {
  try {
    const { apiKey, apiSecret } = req.body;

    if (!apiKey || !apiSecret) {
      return res.status(400).json({ error: 'API Key and Secret are required' });
    }

    console.log('🔍 Validating API Key...');
    const isValid = await binanceService.validateApiKey(apiKey, apiSecret);

    if (isValid) {
      res.json({
        valid: true,
        message: 'API Key is valid',
      });
    } else {
      res.status(400).json({
        valid: false,
        error: 'Invalid API Key or Secret',
      });
    }
  } catch (error: any) {
    console.error('Validate API Key error:', error);
    res.status(500).json({
      valid: false,
      error: 'Failed to validate API Key',
      details: error.message,
    });
  }
}
