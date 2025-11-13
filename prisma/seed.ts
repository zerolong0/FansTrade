import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 创建测试用户
  // 测试密码统一为: password123
  const hashedPassword = await bcrypt.hash('password123', 10);

  const user1 = await prisma.user.upsert({
    where: { email: 'trader1@example.com' },
    update: {},
    create: {
      email: 'trader1@example.com',
      username: 'cryptowhale',
      passwordHash: hashedPassword,
      displayName: 'Crypto Whale',
      bio: '专注 BTC/ETH 交易，5年经验',
      isVerified: true,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'trader2@example.com' },
    update: {},
    create: {
      email: 'trader2@example.com',
      username: 'btcmaster',
      passwordHash: hashedPassword,
      displayName: 'BTC Master',
      bio: '比特币价值投资者',
      isVerified: true,
    },
  });

  const user3 = await prisma.user.upsert({
    where: { email: 'trader3@example.com' },
    update: {},
    create: {
      email: 'trader3@example.com',
      username: 'ethtrader',
      passwordHash: hashedPassword,
      displayName: 'ETH Trader',
      bio: 'DeFi 和以太坊生态爱好者',
      isVerified: false,
    },
  });

  // 创建测试交易策略
  await prisma.tradingStrategy.upsert({
    where: { traderId: user1.id },
    update: {},
    create: {
      traderId: user1.id,
      totalTrades: 150,
      winRate: 68.5,
      avgHoldingDays: 7.2,
      maxDrawdown: 15.3,
      annualizedReturn: 45.6,
      sharpeRatio: 1.8,
      tradingStyle: 'swing',
      riskLevel: 'moderate',
      description: '稳健的波段交易策略，专注于主流币种',
      suitableFor: '中等风险承受能力的投资者',
      topSymbols: ['BTC-USD', 'ETH-USD', 'SOL-USD'],
    },
  });

  await prisma.tradingStrategy.upsert({
    where: { traderId: user2.id },
    update: {},
    create: {
      traderId: user2.id,
      totalTrades: 85,
      winRate: 72.0,
      avgHoldingDays: 30.5,
      maxDrawdown: 8.5,
      annualizedReturn: 35.2,
      sharpeRatio: 2.1,
      tradingStyle: 'value',
      riskLevel: 'conservative',
      description: '价值投资策略，长期持有优质资产',
      suitableFor: '保守型投资者，寻求稳定收益',
      topSymbols: ['BTC-USD'],
    },
  });

  console.log('✅ Seed data created:', {
    user1: user1.username,
    user2: user2.username,
    user3: user3.username,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
