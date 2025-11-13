import api from './client';
import type { Trader } from './types';

export interface TradersResponse {
  traders: Trader[];
  total: number;
  limit: number;
  offset: number;
}

export interface TraderDetailResponse {
  trader: Trader;
  strategy: {
    totalTrades: number;
    winRate: number;
    avgHoldingDays: number;
    maxDrawdown: number;
    annualizedReturn: number;
    sharpeRatio: number | null;
    tradingStyle: string;
    riskLevel: string;
    description: string;
    suitableFor: string;
    topSymbols: string[];
  } | null;
}

export const tradersAPI = {
  getTraders: (limit = 20, offset = 0) =>
    api.get<TradersResponse>('/traders', { params: { limit, offset } }),

  getTraderDetail: (id: string) =>
    api.get<TraderDetailResponse>(`/traders/${id}`),
};
