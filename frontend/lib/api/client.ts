import axios from 'axios';
import type {
  AuthResponse,
  Follow,
  FollowStats,
  PaginatedFollowing,
  Trader,
  TradingSignal,
  TradeRecord,
  TradeStats,
  PaginatedTradeHistory,
  BinanceApiKey,
  TradingPair,
} from './types';

// In production, use relative path (Nginx will proxy /api to backend)
// In development, use localhost:3000
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? ''
    : 'http://localhost:3000');

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  register: (data: { email: string; username: string; password: string }) =>
    api.post<AuthResponse>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', data),

  getMe: () => api.get<{ user: Trader }>('/auth/me'),
};

// Follow API
export const followAPI = {
  follow: (userId: string, config?: { autoNotify?: boolean; symbolsFilter?: string[] }) =>
    api.post<{ message: string; follow: Follow; trader: Trader }>(`/follow/${userId}`, { config }),

  unfollow: (userId: string) =>
    api.delete<{ message: string }>(`/follow/${userId}`),

  getFollowing: (limit = 20, offset = 0) =>
    api.get<PaginatedFollowing>('/follow/following', { params: { limit, offset } }),

  getFollowers: (limit = 20, offset = 0) =>
    api.get<PaginatedFollowing>('/follow/followers', { params: { limit, offset } }),

  checkFollowing: (userId: string) =>
    api.get<{ isFollowing: boolean }>(`/follow/check/${userId}`),

  getStats: (userId: string) =>
    api.get<FollowStats>(`/follow/stats/${userId}`),
};

// Trading Signals API
export const signalsAPI = {
  getSignals: (params?: { symbol?: string; status?: string; limit?: number; offset?: number }) =>
    api.get<{ signals: TradingSignal[]; total: number }>('/signals', { params }),

  getSignalById: (signalId: string) =>
    api.get<{ signal: TradingSignal }>(`/signals/${signalId}`),
};

// Copy Trade API
export const copyTradeAPI = {
  executeTrade: (data: { signalId: string; amount: number }) =>
    api.post<{ success: boolean; orderId: string }>('/copy-trade/execute', data),

  getHistory: (params?: { page?: number; limit?: number; status?: string; symbol?: string }) =>
    api.get<PaginatedTradeHistory>('/copy-trade/history', { params }),

  getStats: () =>
    api.get<TradeStats>('/copy-trade/stats'),
};

// Binance API Key Management
export const binanceAPI = {
  addApiKey: (data: { apiKey: string; apiSecret: string; label?: string }) =>
    api.post<{ message: string; apiKey: BinanceApiKey }>('/binance/api-keys', data),

  getApiKeys: () =>
    api.get<{ apiKeys: BinanceApiKey[] }>('/binance/api-keys'),

  deleteApiKey: (keyId: string) =>
    api.delete<{ message: string }>(`/binance/api-keys/${keyId}`),

  updateApiKey: (keyId: string, data: { label?: string; isActive?: boolean }) =>
    api.patch<{ message: string; apiKey: BinanceApiKey }>(`/binance/api-keys/${keyId}`, data),
};

// Trading Pairs API
export const tradingPairsAPI = {
  getAll: () =>
    api.get<{ pairs: TradingPair[] }>('/trading-pairs'),

  sync: () =>
    api.post<{ message: string; count: number }>('/trading-pairs/sync'),
};

export default api;
