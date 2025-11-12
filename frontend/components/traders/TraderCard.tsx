'use client';

import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp } from 'lucide-react';
import { FollowButton } from './FollowButton';
import type { Trader } from '@/lib/api/types';

interface TraderCardProps {
  trader: Trader;
}

export function TraderCard({ trader }: TraderCardProps) {
  const followersCount = trader._count?.followers || 0;

  return (
    <motion.div
      className="card-trader group"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Avatar className="w-12 h-12 ring-2 ring-primary/20">
            <AvatarImage src={trader.avatarUrl || undefined} />
            <AvatarFallback className="bg-gradient-primary text-black font-bold">
              {trader.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-lg">{trader.displayName || trader.username}</h3>
              {trader.isVerified && (
                <Badge variant="outline" className="border-primary text-primary text-xs">
                  Verified
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">@{trader.username}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="glass p-3 rounded-lg">
          <div className="flex items-center space-x-2 mb-1">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Followers</span>
          </div>
          <p className="text-2xl font-bold text-glow">{followersCount}</p>
        </div>

        <div className="glass p-3 rounded-lg">
          <div className="flex items-center space-x-2 mb-1">
            <TrendingUp className="w-4 h-4 text-success" />
            <span className="text-xs text-muted-foreground">Win Rate</span>
          </div>
          <p className="text-2xl font-bold text-success">--</p>
        </div>
      </div>

      <FollowButton traderId={trader.id} />
    </motion.div>
  );
}
