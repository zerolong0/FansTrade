'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Trophy,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  Target,
  Crown,
  Medal,
  Award,
  CheckCircle,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import api from '@/lib/api/client';

type SortBy = 'profit' | 'winRate' | 'followers' | 'volume' | 'roi' | 'trades';

interface LeaderboardTrader {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  isVerified: boolean;
  rank: number;
  stats: {
    totalProfit: number;
    winRate: number;
    totalTrades: number;
    followersCount: number;
    totalVolume: number;
    roi: number;
  };
}

const sortOptions = [
  { value: 'profit' as SortBy, label: '总收益', icon: <DollarSign className="w-4 h-4" /> },
  { value: 'winRate' as SortBy, label: '胜率', icon: <Target className="w-4 h-4" /> },
  { value: 'followers' as SortBy, label: '跟随者', icon: <Users className="w-4 h-4" /> },
  { value: 'volume' as SortBy, label: '交易量', icon: <Activity className="w-4 h-4" /> },
  { value: 'roi' as SortBy, label: 'ROI', icon: <TrendingUp className="w-4 h-4" /> },
  { value: 'trades' as SortBy, label: '交易次数', icon: <Trophy className="w-4 h-4" /> },
];

export default function LeaderboardPage() {
  const router = useRouter();
  const [traders, setTraders] = useState<LeaderboardTrader[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortBy>('profit');

  useEffect(() => {
    loadLeaderboard();
  }, [sortBy]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/leaderboard?sortBy=${sortBy}&limit=50`);
      setTraders(response.data.traders);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1)
      return <Crown className="w-8 h-8 text-yellow-400" style={{ filter: 'drop-shadow(0 0 8px rgba(250, 204, 21, 0.8))' }} />;
    if (rank === 2)
      return <Medal className="w-7 h-7 text-gray-400" style={{ filter: 'drop-shadow(0 0 6px rgba(156, 163, 175, 0.6))' }} />;
    if (rank === 3)
      return <Award className="w-6 h-6 text-amber-600" style={{ filter: 'drop-shadow(0 0 6px rgba(217, 119, 6, 0.6))' }} />;
    return null;
  };

  const getRankBadgeClass = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black';
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500 text-black';
    if (rank === 3) return 'bg-gradient-to-r from-amber-500 to-amber-700 text-white';
    return 'bg-gray-700 text-gray-300';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toFixed(2);
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse text-primary text-xl">Loading leaderboard...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="container mx-auto px-4 py-12 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="w-12 h-12 text-primary" />
            <h1 className="text-5xl font-bold gradient-text">排行榜</h1>
            <Trophy className="w-12 h-12 text-primary" />
          </div>
          <p className="text-gray-400 text-lg">发现平台上最优秀的交易大神</p>
        </motion.div>

        {/* Sort Options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap justify-center gap-3 mb-8"
        >
          {sortOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSortBy(option.value)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                sortBy === option.value
                  ? 'bg-gradient-primary text-black shadow-lg scale-105'
                  : 'glass hover:bg-white/10'
              }`}
            >
              {option.icon}
              {option.label}
            </button>
          ))}
        </motion.div>

        {/* Leaderboard */}
        <div className="space-y-4">
          {traders.map((trader, index) => (
            <motion.div
              key={trader.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className={`glass cursor-pointer hover:bg-white/10 transition-all relative overflow-hidden ${
                  trader.rank <= 3 ? 'ring-2 ring-primary/30' : ''
                }`}
                onClick={() => router.push(`/traders/${trader.id}`)}
              >
                {trader.rank <= 3 && (
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-secondary/10 pointer-events-none" />
                )}

                <CardContent className="pt-6 relative">
                  <div className="flex items-center gap-6">
                    {/* Rank */}
                    <div className="flex flex-col items-center min-w-[80px]">
                      {getRankIcon(trader.rank) || (
                        <div
                          className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold ${getRankBadgeClass(
                            trader.rank
                          )}`}
                        >
                          {trader.rank}
                        </div>
                      )}
                      <span className="text-xs text-gray-500 mt-1">#{trader.rank}</span>
                    </div>

                    {/* Trader Info */}
                    <div className="flex items-center gap-4 flex-1">
                      <Avatar className="w-16 h-16 ring-4 ring-primary/20">
                        <AvatarImage src={trader.avatarUrl || undefined} />
                        <AvatarFallback className="bg-gradient-primary text-black font-bold text-xl">
                          {trader.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-bold text-white">
                            {trader.displayName || trader.username}
                          </h3>
                          {trader.isVerified && <CheckCircle className="w-5 h-5 text-primary" />}
                        </div>
                        <p className="text-sm text-gray-400">@{trader.username}</p>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-6 flex-1">
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">总收益</div>
                        <div
                          className={`text-lg font-bold ${
                            trader.stats.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}
                        >
                          ${formatNumber(trader.stats.totalProfit)}
                        </div>
                      </div>

                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">胜率</div>
                        <div className="text-lg font-bold text-primary">
                          {trader.stats.winRate.toFixed(1)}%
                        </div>
                      </div>

                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">ROI</div>
                        <div
                          className={`text-lg font-bold ${
                            trader.stats.roi >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}
                        >
                          {trader.stats.roi.toFixed(2)}%
                        </div>
                      </div>

                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">交易量</div>
                        <div className="text-sm font-semibold text-gray-300">
                          ${formatNumber(trader.stats.totalVolume)}
                        </div>
                      </div>

                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">交易次数</div>
                        <div className="text-sm font-semibold text-gray-300">
                          {trader.stats.totalTrades}
                        </div>
                      </div>

                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">跟随者</div>
                        <div className="text-sm font-semibold text-primary">
                          {trader.stats.followersCount}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {traders.length === 0 && (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">暂无排行数据</p>
              <p className="text-gray-500 text-sm mt-2">开始交易，登上排行榜！</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
