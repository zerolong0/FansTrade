import axios from 'axios';
import type { AuthResponse, Follow, FollowStats, PaginatedFollowing, Trader } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

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

export default api;
