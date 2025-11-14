'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  User,
  Users,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  DollarSign,
  CheckCircle,
  Settings,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { FollowButton } from '@/components/traders/FollowButton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { followAPI } from '@/lib/api/client';
import type { Trader } from '@/lib/api/types';

// Mock trading data for demonstration
const mockTradingHistory = [
  {
    id: '1',
    symbol: 'BTC/USDT',
    type: 'BUY',
    price: 45230.5,
    amount: 0.25,
    total: 11307.63,
    profit: 2340.5,
    profitPercent: 25.6,
    timestamp: '2025-01-13 14:23:00',
    status: 'closed',
  },
  {
    id: '2',
    symbol: 'ETH/USDT',
    type: 'SELL',
    price: 3420.8,
    amount: 2.5,
    total: 8552.0,
    profit: -150.2,
    profitPercent: -1.7,
    timestamp: '2025-01-13 12:15:00',
    status: 'closed',
  },
  {
    id: '3',
    symbol: 'SOL/USDT',
    type: 'BUY',
    price: 98.45,
    amount: 50,
    total: 4922.5,
    profit: 890.3,
    profitPercent: 22.1,
    timestamp: '2025-01-13 10:05:00',
    status: 'closed',
  },
];

const mockStats = {
  totalTrades: 156,
  winRate: 68.5,
  totalProfit: 45620.5,
  avgProfit: 15.8,
  bestTrade: 5640.2,
  worstTrade: -1230.5,
};

export default function TraderDetailPage() {
  const params = useParams();
  const traderId = params.id as string;
  const [trader, setTrader] = useState<Trader | null>(null);
  const [followerStats, setFollowerStats] = useState({ followersCount: 0, followingCount: 0 });
  const [loading, setLoading] = useState(true);

  // For demo, using mock data
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setTrader({
        id: traderId,
        username: 'cryptowhale',
        email: 'whale@example.com',
        displayName: 'Crypto Whale',
        avatarUrl: null,
        isVerified: true,
        _count: { followers: 1234 },
      });
      setFollowerStats({
        followersCount: 1234,
        followingCount: 89,
      });
      setLoading(false);
    }, 500);
  }, [traderId]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse text-primary text-xl">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!trader) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <p className="text-gray-400">Trader not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="container mx-auto px-4 py-12 space-y-8">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-8 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 pointer-events-none" />

          <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            <Avatar className="w-24 h-24 ring-4 ring-primary/30">
              <AvatarImage src={trader.avatarUrl || undefined} />
              <AvatarFallback className="bg-gradient-primary text-black font-bold text-2xl">
                {trader.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold gradient-text">
                  {trader.displayName || trader.username}
                </h1>
                {trader.isVerified && (
                  <CheckCircle className="w-6 h-6 text-primary" />
                )}
              </div>
              <p className="text-gray-400 mb-4">@{trader.username}</p>

              <div className="flex flex-wrap gap-6">
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {followerStats.followersCount.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-400">Followers</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-secondary">
                    {followerStats.followingCount}
                  </div>
                  <div className="text-sm text-gray-400">Following</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-400">
                    {mockStats.winRate}%
                  </div>
                  <div className="text-sm text-gray-400">Win Rate</div>
                </div>
              </div>
            </div>

            {/* Follow Button */}
            <div className="self-start">
              <FollowButton traderId={trader.id} />
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            icon={<Activity className="w-6 h-6" />}
            label="Total Trades"
            value={mockStats.totalTrades.toString()}
            color="primary"
          />
          <StatsCard
            icon={<DollarSign className="w-6 h-6" />}
            label="Total Profit"
            value={`$${mockStats.totalProfit.toLocaleString()}`}
            color="green"
          />
          <StatsCard
            icon={<TrendingUp className="w-6 h-6" />}
            label="Best Trade"
            value={`$${mockStats.bestTrade.toLocaleString()}`}
            color="green"
          />
          <StatsCard
            icon={<TrendingDown className="w-6 h-6" />}
            label="Worst Trade"
            value={`$${Math.abs(mockStats.worstTrade).toLocaleString()}`}
            color="red"
          />
        </div>

        {/* Trading History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Recent Trading History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockTradingHistory.map((trade, index) => (
                  <motion.div
                    key={trade.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="glass rounded-lg p-4 hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-bold text-white">{trade.symbol}</span>
                          <span
                            className={`px-2 py-1 rounded text-xs font-bold ${
                              trade.type === 'BUY'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {trade.type}
                          </span>
                        </div>
                        <div className="text-sm text-gray-400">
                          Price: ${trade.price.toLocaleString()} | Amount: {trade.amount}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{trade.timestamp}</div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-xl font-bold ${
                            trade.profit >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}
                        >
                          {trade.profit >= 0 ? '+' : ''}${trade.profit.toLocaleString()}
                        </div>
                        <div
                          className={`text-sm ${
                            trade.profitPercent >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}
                        >
                          {trade.profitPercent >= 0 ? '+' : ''}
                          {trade.profitPercent}%
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

function StatsCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  const colorClasses = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    green: 'text-green-400',
    red: 'text-red-400',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="glass rounded-xl p-6 relative overflow-hidden group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative">
        <div className={`${colorClasses[color as keyof typeof colorClasses]} mb-2`}>{icon}</div>
        <div className="text-3xl font-bold mb-1">{value}</div>
        <div className="text-sm text-gray-400">{label}</div>
      </div>
    </motion.div>
  );
}
