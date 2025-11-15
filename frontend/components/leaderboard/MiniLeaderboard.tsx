'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, Crown, Medal, Award, ArrowRight, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import api from '@/lib/api/client';

type SortBy = 'profit' | 'winRate' | 'followers' | 'volume' | 'roi' | 'trades';

interface LeaderboardTrader {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  rank: number;
  stats: {
    totalProfit: number;
    winRate: number;
    roi: number;
  };
}

export function MiniLeaderboard() {
  const router = useRouter();
  const [traders, setTraders] = useState<LeaderboardTrader[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMiniLeaderboard();
  }, []);

  const loadMiniLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/leaderboard?sortBy=profit&limit=5');
      setTraders(response.data.traders);
    } catch (error) {
      console.error('Failed to load mini leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-4 h-4 text-gray-400" />;
    if (rank === 3) return <Award className="w-4 h-4 text-amber-600" />;
    return null;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toFixed(2);
  };

  if (loading) {
    return (
      <Card className="glass sticky top-20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            排行榜
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-pulse text-muted-foreground">加载中...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass sticky top-20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          <span className="gradient-text">排行榜</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {traders.length > 0 ? (
          <>
            {traders.map((trader) => (
              <div
                key={trader.id}
                onClick={() => router.push(`/traders/${trader.id}`)}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all hover:bg-white/5 ${
                  trader.rank <= 3 ? 'bg-white/5' : ''
                }`}
              >
                {/* Rank */}
                <div className="flex items-center justify-center w-8">
                  {getRankIcon(trader.rank) || (
                    <span className="text-sm font-bold text-gray-500">#{trader.rank}</span>
                  )}
                </div>

                {/* Avatar */}
                <Avatar className="w-10 h-10 ring-2 ring-primary/20">
                  <AvatarImage src={trader.avatarUrl || undefined} />
                  <AvatarFallback className="bg-gradient-primary text-black text-xs font-bold">
                    {trader.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">
                    {trader.displayName || trader.username}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className={`font-semibold ${
                        trader.stats.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      ${formatNumber(trader.stats.totalProfit)}
                    </span>
                    <span className="text-gray-500">•</span>
                    <span className="text-primary">{trader.stats.winRate.toFixed(1)}%</span>
                  </div>
                </div>

                {/* ROI Badge */}
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-primary" />
                    <span
                      className={`text-xs font-bold ${
                        trader.stats.roi >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {trader.stats.roi.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* View More Button */}
            <Button
              onClick={() => router.push('/leaderboard')}
              variant="outline"
              className="w-full mt-4 group hover:bg-gradient-primary hover:text-black hover:border-transparent transition-all"
            >
              <span>查看完整排行榜</span>
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </>
        ) : (
          <div className="text-center py-8">
            <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-400">暂无排行数据</p>
            <p className="text-xs text-gray-500 mt-1">开始交易，登上排行榜！</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
