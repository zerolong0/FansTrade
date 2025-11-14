'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  User,
  Users,
  TrendingUp,
  Settings,
  Bell,
  DollarSign,
  Activity,
  CheckCircle,
  XCircle,
  Edit,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/store/auth';
import { followAPI, copyTradeAPI } from '@/lib/api/client';
import type { Follow, TradeStats } from '@/lib/api/types';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [following, setFollowing] = useState<Follow[]>([]);
  const [tradeStats, setTradeStats] = useState<TradeStats | null>(null);
  const [stats, setStats] = useState({
    totalFollowing: 0,
    totalTrades: 0,
    totalProfit: 0,
    winRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Load user's following list
    loadDashboardData();
  }, [isAuthenticated, router]);

  const loadDashboardData = async () => {
    try {
      // Load following list
      try {
        const followingResponse = await followAPI.getFollowing(50, 0);
        setFollowing(followingResponse.data.following);
      } catch (error) {
        console.error('Failed to load following:', error);
        setFollowing([]);
      }

      // Load trade statistics
      try {
        const statsResponse = await copyTradeAPI.getStats();
        setTradeStats(statsResponse.data);

        setStats({
          totalFollowing: following.length,
          totalTrades: statsResponse.data.totalTrades,
          totalProfit: statsResponse.data.totalProfit,
          winRate: statsResponse.data.winRate,
        });
      } catch (error) {
        console.error('Failed to load trade stats:', error);
        setStats({
          totalFollowing: following.length,
          totalTrades: 0,
          totalProfit: 0,
          winRate: 0,
        });
      }

      setLoading(false);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse text-primary text-xl">Loading dashboard...</div>
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

          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <Avatar className="w-20 h-20 ring-4 ring-primary/30">
                <AvatarImage src={user?.avatarUrl || undefined} />
                <AvatarFallback className="bg-gradient-primary text-black font-bold text-2xl">
                  {user?.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold gradient-text">
                    {user?.displayName || user?.username}
                  </h1>
                  {user?.isVerified && <CheckCircle className="w-6 h-6 text-primary" />}
                </div>
                <p className="text-gray-400 mb-2">@{user?.username}</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>

            <Button variant="outline" className="self-start">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            icon={<Users className="w-6 h-6" />}
            label="Following"
            value={stats.totalFollowing.toString()}
            color="primary"
          />
          <StatsCard
            icon={<Activity className="w-6 h-6" />}
            label="Total Trades"
            value={stats.totalTrades.toString()}
            color="secondary"
          />
          <StatsCard
            icon={<DollarSign className="w-6 h-6" />}
            label="Total Profit"
            value={`$${stats.totalProfit.toFixed(2)}`}
            color={stats.totalProfit >= 0 ? 'green' : 'red'}
          />
          <StatsCard
            icon={<TrendingUp className="w-6 h-6" />}
            label="Win Rate"
            value={`${stats.winRate.toFixed(1)}%`}
            color="yellow"
          />
        </div>

        {/* Detailed Stats */}
        {tradeStats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <Card className="glass">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-sm text-gray-400 mb-2">Success Rate</div>
                  <div className="text-2xl font-bold">
                    {tradeStats.totalTrades > 0
                      ? ((tradeStats.successfulTrades / tradeStats.totalTrades) * 100).toFixed(1)
                      : 0}
                    %
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {tradeStats.successfulTrades} / {tradeStats.totalTrades} trades
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="glass">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-sm text-gray-400 mb-2">Avg Trade Size</div>
                  <div className="text-2xl font-bold">${tradeStats.avgTradeSize.toFixed(2)}</div>
                  <div className="text-xs text-gray-500 mt-1">Per trade</div>
                </div>
              </CardContent>
            </Card>
            <Card className="glass">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-sm text-gray-400 mb-2">Total Volume</div>
                  <div className="text-2xl font-bold">${tradeStats.totalVolume.toFixed(2)}</div>
                  <div className="text-xs text-gray-500 mt-1">All-time</div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Following List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Following Traders
                </div>
                <Button variant="outline" size="sm" onClick={() => router.push('/traders')}>
                  Discover More
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {following.map((follow, index) => (
                  <motion.div
                    key={follow.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="glass rounded-lg p-4 hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className="flex items-center gap-4 flex-1 cursor-pointer"
                        onClick={() => router.push(`/traders/${follow.trader.id}`)}
                      >
                        <Avatar className="w-12 h-12 ring-2 ring-primary/20">
                          <AvatarImage src={follow.trader.avatarUrl || undefined} />
                          <AvatarFallback className="bg-gradient-primary text-black font-bold">
                            {follow.trader.username.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-white">
                              {follow.trader.displayName || follow.trader.username}
                            </h3>
                            {follow.trader.isVerified && (
                              <CheckCircle className="w-4 h-4 text-primary" />
                            )}
                          </div>
                          <p className="text-sm text-gray-400">@{follow.trader.username}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {follow.trader._count?.followers || 0} followers
                            </span>
                            <span>
                              Following since {new Date(follow.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right mr-4">
                          <div className="flex items-center gap-2 text-sm">
                            {follow.config.autoNotify ? (
                              <span className="flex items-center gap-1 text-green-400">
                                <CheckCircle className="w-4 h-4" />
                                Notifications On
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-gray-500">
                                <XCircle className="w-4 h-4" />
                                Notifications Off
                              </span>
                            )}
                          </div>
                          {follow.config.symbolsFilter &&
                            follow.config.symbolsFilter.length > 0 && (
                              <div className="text-xs text-gray-500 mt-1">
                                Symbols: {follow.config.symbolsFilter.join(', ')}
                              </div>
                            )}
                        </div>

                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {following.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 mb-4">You're not following any traders yet</p>
                    <Button onClick={() => router.push('/traders')}>Discover Traders</Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ActionCard
            icon={<TrendingUp className="w-8 h-8" />}
            title="Trading Signals"
            description="View active trading signals from traders you follow"
            onClick={() => router.push('/signals')}
          />
          <ActionCard
            icon={<Activity className="w-8 h-8" />}
            title="Trade History"
            description="Check your copy trade history and performance"
            onClick={() => router.push('/trades')}
          />
          <ActionCard
            icon={<Settings className="w-8 h-8" />}
            title="API Keys"
            description="Manage your Binance API keys"
            onClick={() => router.push('/settings/api-keys')}
          />
        </div>
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
    yellow: 'text-yellow-400',
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

function ActionCard({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className="glass rounded-xl p-6 cursor-pointer relative overflow-hidden group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative">
        <div className="text-primary mb-4">{icon}</div>
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <p className="text-sm text-gray-400">{description}</p>
      </div>
    </motion.div>
  );
}
