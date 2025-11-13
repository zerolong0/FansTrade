export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  isVerified: boolean;
}

export interface Trader extends User {
  bio?: string | null;
  twitterHandle?: string | null;
  _count?: {
    followers: number;
    following?: number;
  };
}

export interface FollowStats {
  userId: string;
  followersCount: number;
  followingCount: number;
}

export interface Follow {
  id: string;
  traderId: string;
  createdAt: string;
  config: {
    autoNotify?: boolean;
    symbolsFilter?: string[];
  };
  trader: Trader;
}

export interface PaginatedFollowing {
  following: Follow[];
  total: number;
  limit: number;
  offset: number;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}
