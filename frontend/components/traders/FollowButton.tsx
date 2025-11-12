'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { followAPI } from '@/lib/api/client';
import { useAuthStore } from '@/lib/store/auth';
import { useFollowStore } from '@/lib/store/follow';
import { toast } from 'sonner';

interface FollowButtonProps {
  traderId: string;
}

export function FollowButton({ traderId }: FollowButtonProps) {
  const { isAuthenticated } = useAuthStore();
  const { addFollowing, removeFollowing } = useFollowStore();
  const [isFollowing, setIsFollowing] = useState(false);
  const queryClient = useQueryClient();

  // Check follow status
  const { data: followStatus } = useQuery({
    queryKey: ['follow-status', traderId],
    queryFn: async () => {
      const res = await followAPI.checkFollowing(traderId);
      return res.data;
    },
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (followStatus) {
      setIsFollowing(followStatus.isFollowing);
    }
  }, [followStatus]);

  // Follow mutation
  const followMutation = useMutation({
    mutationFn: () => followAPI.follow(traderId),
    onSuccess: () => {
      setIsFollowing(true);
      addFollowing(traderId);
      queryClient.invalidateQueries({ queryKey: ['follow-status', traderId] });
      toast.success('Successfully followed trader');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to follow');
    },
  });

  // Unfollow mutation
  const unfollowMutation = useMutation({
    mutationFn: () => followAPI.unfollow(traderId),
    onSuccess: () => {
      setIsFollowing(false);
      removeFollowing(traderId);
      queryClient.invalidateQueries({ queryKey: ['follow-status', traderId] });
      toast.success('Unfollowed trader');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to unfollow');
    },
  });

  const handleClick = () => {
    if (!isAuthenticated) {
      toast.error('Please login to follow traders');
      return;
    }

    if (isFollowing) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  const isLoading = followMutation.isPending || unfollowMutation.isPending;

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading}
      className={`w-full ${
        isFollowing
          ? 'bg-gradient-to-r from-purple-600 to-purple-500'
          : 'btn-primary'
      }`}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isFollowing ? (
        <>
          <UserMinus className="w-4 h-4 mr-2" />
          Following
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4 mr-2" />
          Follow
        </>
      )}
    </Button>
  );
}
