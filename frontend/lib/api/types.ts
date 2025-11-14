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

// Trading-related types
export interface TradingSignal {
  id: string;
  strategyId: string;
  symbol: string;
  signalType: string; // STRONG_BUY, BUY, NEUTRAL, SELL, STRONG_SELL
  price: string;
  confidence: number;
  indicators: Record<string, any>;
  status: string; // PENDING, EXECUTED, EXPIRED
  createdAt: string;
  expiresAt: string;
}

export interface TradeRecord {
  id: string;
  userId: string;
  signalId: string | null;
  traderId: string | null;
  symbol: string;
  side: string; // BUY, SELL
  orderType: string; // MARKET, LIMIT
  binanceOrderId: string;
  status: string; // PENDING, FILLED, FAILED
  requestedAmount: string;
  executedQty: string;
  executedPrice: string;
  executedValue: string;
  commission: string;
  commissionAsset: string;
  closePrice: string | null;
  closedAt: string | null;
  realizedPnl: string | null;
  realizedPnlPct: number | null;
  mode: string; // auto, manual
  errorMessage: string | null;
  createdAt: string;
  executedAt: string | null;
}

export interface TradeStats {
  totalTrades: number;
  successfulTrades: number;
  failedTrades: number;
  winRate: number;
  totalVolume: number;
  avgTradeSize: number;
  totalProfit: number;
  avgProfit: number;
  largestWin: number;
  largestLoss: number;
  totalCommission: number;
}

export interface PaginatedTradeHistory {
  trades: TradeRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BinanceApiKey {
  id: string;
  label: string | null;
  isActive: boolean;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface TradingPair {
  id: string;
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  isActive: boolean;
}
