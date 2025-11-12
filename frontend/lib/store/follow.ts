import { create } from 'zustand';

interface FollowState {
  followingIds: Set<string>;
  addFollowing: (userId: string) => void;
  removeFollowing: (userId: string) => void;
  isFollowing: (userId: string) => boolean;
}

export const useFollowStore = create<FollowState>((set, get) => ({
  followingIds: new Set(),
  addFollowing: (userId) =>
    set((state) => ({
      followingIds: new Set(state.followingIds).add(userId),
    })),
  removeFollowing: (userId) => {
    const newSet = new Set(get().followingIds);
    newSet.delete(userId);
    set({ followingIds: newSet });
  },
  isFollowing: (userId) => get().followingIds.has(userId),
}));
