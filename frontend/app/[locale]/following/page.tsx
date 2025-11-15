'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Users,
  CheckCircle,
  XCircle,
  Edit,
  UserMinus,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/store/auth';
import { followAPI } from '@/lib/api/client';
import type { Follow } from '@/lib/api/types';

export default function FollowingPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [following, setFollowing] = useState<Follow[]>([]);
  const [loading, setLoading] = useState(true);
  const [unfollowingId, setUnfollowingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadFollowing();
  }, [isAuthenticated, router]);

  const loadFollowing = async () => {
    try {
      const response = await followAPI.getFollowing(50, 0);
      setFollowing(response.data.following);
    } catch (error) {
      console.error('Failed to load following:', error);
      setFollowing([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async (userId: string) => {
    setUnfollowingId(userId);
    try {
      await followAPI.unfollow(userId);
      setFollowing(following.filter(f => f.trader.id !== userId));
    } catch (error) {
      console.error('Failed to unfollow:', error);
    } finally {
      setUnfollowingId(null);
    }
  };

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

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold gradient-text mb-2">Following</h1>
          <p className="text-gray-400">
            Traders you're following ({following.length})
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Following Traders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {following.map((follow, index) => (
                  <motion.div
                    key={follow.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
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

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnfollow(follow.trader.id)}
                          disabled={unfollowingId === follow.trader.id}
                          className="hover:text-red-400"
                        >
                          <UserMinus className="w-4 h-4" />
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
      </div>
    </div>
  );
}
