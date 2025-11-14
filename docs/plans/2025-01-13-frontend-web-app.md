# FansTrade Frontend Web App Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a modern, dark-themed web frontend for FansTrade social trading platform with follow functionality.

**Architecture:** Next.js 14 App Router with 3 core pages (Home, Traders List, Trader Detail), modal-based auth, drawer-based follow lists. Black cyberpunk theme with neon gradients, glassmorphism cards, and smooth animations.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Zustand, React Query, Framer Motion, Lucide Icons

---

## Prerequisites

- Node.js >= 20
- Backend API running at http://localhost:3000
- Git repository initialized

---

## Task 1: Create Next.js Project Structure

**Files:**
- Create: `frontend/` directory (separate from backend)
- Create: `frontend/package.json`
- Create: `frontend/next.config.js`
- Create: `frontend/tsconfig.json`

### Step 1: Create frontend directory

```bash
cd /Users/zerolong/Documents/AICODE/专项/fanstrade
mkdir frontend
cd frontend
```

### Step 2: Initialize Next.js project

```bash
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"
```

Choose options:
- TypeScript: Yes
- ESLint: Yes
- Tailwind CSS: Yes
- `app/` directory: Yes
- Customize import alias: Yes (@/*)

Expected: Project scaffolded with Next.js 14

### Step 3: Verify project structure

```bash
ls -la
```

Expected files:
- `app/` directory
- `package.json`
- `tailwind.config.ts`
- `tsconfig.json`

### Step 4: Install additional dependencies

```bash
npm install zustand @tanstack/react-query axios framer-motion lucide-react class-variance-authority clsx tailwind-merge
```

### Step 5: Install shadcn/ui

```bash
npx shadcn-ui@latest init
```

Choose options:
- Style: New York
- Base color: Slate
- CSS variables: Yes

### Step 6: Add shadcn/ui components

```bash
npx shadcn-ui@latest add button card avatar badge dialog drawer input label select tabs
```

### Step 7: Create directory structure

```bash
mkdir -p app/{traders,api}
mkdir -p components/{ui,layout,traders,auth}
mkdir -p lib/{api,store,utils}
mkdir -p styles
mkdir -p types
```

### Step 8: Commit initial setup

```bash
git add .
git commit -m "feat: initialize Next.js frontend with Tailwind and shadcn/ui

- Next.js 14 with App Router
- TypeScript configuration
- Tailwind CSS + shadcn/ui
- Project structure created

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 2: Configure ZeroAI-UI Dark Theme

**Files:**
- Modify: `frontend/tailwind.config.ts`
- Create: `frontend/app/globals.css`
- Create: `frontend/lib/utils/cn.ts`

### Step 1: Update Tailwind config with ZeroAI-UI colors

Modify `tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#00F0FF",
          foreground: "#000000",
        },
        secondary: {
          DEFAULT: "#B700FF",
          foreground: "#FFFFFF",
        },
        success: "#00FF88",
        danger: "#FF0066",
        warning: "#FFB800",
        muted: {
          DEFAULT: "#2A2A2A",
          foreground: "#A0A0A0",
        },
        accent: {
          DEFAULT: "#1A1A1A",
          foreground: "#FFFFFF",
        },
        card: {
          DEFAULT: "#1A1A1A",
          foreground: "#FFFFFF",
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #00D9FF 0%, #00F0FF 50%, #B700FF 100%)',
        'gradient-card': 'linear-gradient(135deg, rgba(26, 26, 26, 0.8) 0%, rgba(42, 42, 42, 0.8) 100%)',
      },
      boxShadow: {
        'glow-cyan': '0 0 40px rgba(0, 240, 255, 0.6)',
        'glow-purple': '0 0 40px rgba(183, 0, 255, 0.6)',
        'glow-primary': '0 0 20px rgba(0, 240, 255, 0.5)',
      },
      animation: {
        'scan-line': 'scan 8s linear infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        scan: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(100%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
```

### Step 2: Create global styles with dark theme

Create `app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 5%;
    --foreground: 0 0% 100%;
    --border: 0 0% 16%;
  }

  * {
    @apply border-border;
  }

  body {
    @apply bg-[#0D0D0D] text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }

  /* Scan line effect */
  body::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: repeating-linear-gradient(
      0deg,
      rgba(0, 240, 255, 0.03) 0px,
      rgba(0, 240, 255, 0.03) 1px,
      transparent 1px,
      transparent 2px
    );
    pointer-events: none;
    z-index: 9999;
  }

  /* Glassmorphism utility */
  .glass {
    @apply bg-white/5 backdrop-blur-xl border border-white/10;
  }

  /* Glow text */
  .text-glow {
    text-shadow: 0 0 10px rgba(0, 240, 255, 0.8);
  }

  /* Custom scrollbar */
  ::-webkit-scrollbar {
    width: 8px;
  }

  ::-webkit-scrollbar-track {
    @apply bg-[#0D0D0D];
  }

  ::-webkit-scrollbar-thumb {
    @apply bg-gradient-primary rounded-full;
  }
}

@layer components {
  .btn-primary {
    @apply bg-gradient-primary text-black font-semibold px-6 py-2 rounded-lg
           transition-all duration-300 hover:shadow-glow-cyan hover:scale-105;
  }

  .btn-secondary {
    @apply glass text-white font-semibold px-6 py-2 rounded-lg
           transition-all duration-300 hover:bg-white/10;
  }

  .card-trader {
    @apply glass p-6 rounded-xl transition-all duration-300
           hover:shadow-glow-primary hover:scale-[1.02];
  }
}
```

### Step 3: Create cn utility

Create `lib/utils/cn.ts`:

```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### Step 4: Update root layout

Modify `app/layout.tsx`:

```typescript
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono"
});

export const metadata: Metadata = {
  title: "FansTrade - Follow the Best Traders",
  description: "Social trading platform powered by AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

### Step 5: Test theme

```bash
npm run dev
```

Open http://localhost:3001 (assuming backend is on 3000)

Expected: Dark background with scan line effect

### Step 6: Commit theme configuration

```bash
git add .
git commit -m "feat: configure ZeroAI-UI dark cyberpunk theme

- Tailwind config with neon colors
- Glassmorphism utilities
- Scan line background effect
- Custom scrollbar styles
- Inter and JetBrains Mono fonts

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 3: Setup API Client and State Management

**Files:**
- Create: `frontend/lib/api/client.ts`
- Create: `frontend/lib/api/types.ts`
- Create: `frontend/lib/store/auth.ts`
- Create: `frontend/lib/store/follow.ts`

### Step 1: Create API types

Create `lib/api/types.ts`:

```typescript
export interface User {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  isVerified: boolean;
}

export interface Trader extends User {
  _count?: {
    followers: number;
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
```

### Step 2: Create API client

Create `lib/api/client.ts`:

```typescript
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
```

### Step 3: Create auth store

Create `lib/store/auth.ts`:

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../api/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => {
        localStorage.setItem('token', token);
        set({ user, token, isAuthenticated: true });
      },
      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
```

### Step 4: Create follow store

Create `lib/store/follow.ts`:

```typescript
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
```

### Step 5: Create environment file

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Step 6: Commit API setup

```bash
git add .
git commit -m "feat: setup API client and state management

- Axios client with auth interceptor
- TypeScript types for API responses
- Zustand stores for auth and follow state
- Environment configuration

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 4: Create Core UI Components

**Files:**
- Create: `frontend/components/traders/TraderCard.tsx`
- Create: `frontend/components/traders/FollowButton.tsx`
- Create: `frontend/components/traders/StatsDisplay.tsx`
- Create: `frontend/components/layout/Navbar.tsx`

### Step 1: Create TraderCard component

Create `components/traders/TraderCard.tsx`:

```typescript
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
```

### Step 2: Create FollowButton component

Create `components/traders/FollowButton.tsx`:

```typescript
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
```

### Step 3: Create Navbar component

Create `components/layout/Navbar.tsx`:

```typescript
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { TrendingUp, User, LogOut } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth';

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();

  return (
    <nav className="glass border-b border-white/10 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <TrendingUp className="w-6 h-6 text-primary" />
          <span className="text-xl font-bold text-glow">FansTrade</span>
        </Link>

        <div className="flex items-center space-x-6">
          <Link href="/traders" className="text-sm hover:text-primary transition-colors">
            Traders
          </Link>

          {isAuthenticated ? (
            <>
              <Link href="/following" className="text-sm hover:text-primary transition-colors">
                Following
              </Link>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-muted-foreground">
                  @{user?.username}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="hover:text-danger"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </>
          ) : (
            <Button size="sm" className="btn-primary">
              <User className="w-4 h-4 mr-2" />
              Login
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
```

### Step 4: Install missing dependencies

```bash
npm install sonner
```

### Step 5: Commit UI components

```bash
git add .
git commit -m "feat: create core UI components

- TraderCard with glassmorphism design
- FollowButton with loading states
- Navbar with auth integration
- Framer Motion animations

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 5: Create Home Page

**Files:**
- Create: `frontend/app/page.tsx`
- Create: `frontend/components/layout/Hero.tsx`

### Step 1: Create Hero component

Create `components/layout/Hero.tsx`:

```typescript
'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { TrendingUp, Users, Zap } from 'lucide-react';
import Link from 'next/link';

export function Hero() {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto"
        >
          <motion.h1
            className="text-6xl md:text-8xl font-bold mb-6 text-glow"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Follow the Best.
            <br />
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Trade Like a Pro.
            </span>
          </motion.h1>

          <motion.p
            className="text-xl md:text-2xl text-muted-foreground mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Social trading platform powered by AI. Follow top crypto traders
            and replicate their strategies automatically.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Link href="/traders">
              <Button size="lg" className="btn-primary text-lg px-8">
                <TrendingUp className="w-5 h-5 mr-2" />
                Explore Traders
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="btn-secondary text-lg px-8">
              <Zap className="w-5 h-5 mr-2" />
              How It Works
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            className="grid grid-cols-3 gap-8 mt-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <div className="glass p-6 rounded-xl">
              <p className="text-4xl font-bold text-glow mb-2">100+</p>
              <p className="text-muted-foreground">Active Traders</p>
            </div>
            <div className="glass p-6 rounded-xl">
              <p className="text-4xl font-bold text-glow mb-2">10K+</p>
              <p className="text-muted-foreground">Followers</p>
            </div>
            <div className="glass p-6 rounded-xl">
              <p className="text-4xl font-bold text-success mb-2">78%</p>
              <p className="text-muted-foreground">Avg Win Rate</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
```

### Step 2: Create home page

Modify `app/page.tsx`:

```typescript
import { Hero } from '@/components/layout/Hero';
import { Navbar } from '@/components/layout/Navbar';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
    </main>
  );
}
```

### Step 3: Test home page

```bash
npm run dev
```

Open http://localhost:3001

Expected: Hero section with gradient text and stats

### Step 4: Commit home page

```bash
git add .
git commit -m "feat: create home page with hero section

- Animated hero with gradient text
- Call-to-action buttons
- Stats display
- Responsive design

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 6: Create Traders List Page

**Files:**
- Create: `frontend/app/traders/page.tsx`

### Step 1: Create traders page

Create `app/traders/page.tsx`:

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { Navbar } from '@/components/layout/Navbar';
import { TraderCard } from '@/components/traders/TraderCard';
import { Skeleton } from '@/components/ui/skeleton';
import { authAPI } from '@/lib/api/client';

export default function TradersPage() {
  // Mock traders data (replace with real API later)
  const traders = [
    {
      id: '1',
      username: 'cryptowhale',
      displayName: 'Crypto Whale',
      avatarUrl: null,
      isVerified: true,
      _count: { followers: 1234 },
    },
    {
      id: '2',
      username: 'btcmaster',
      displayName: 'BTC Master',
      avatarUrl: null,
      isVerified: true,
      _count: { followers: 890 },
    },
    {
      id: '3',
      username: 'ethtrader',
      displayName: 'ETH Trader',
      avatarUrl: null,
      isVerified: false,
      _count: { followers: 567 },
    },
  ];

  return (
    <main className="min-h-screen">
      <Navbar />

      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-glow">Top Traders</h1>
          <p className="text-muted-foreground">
            Follow the best crypto traders and learn from their strategies
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {traders.map((trader) => (
            <TraderCard key={trader.id} trader={trader} />
          ))}
        </div>
      </div>
    </main>
  );
}
```

### Step 2: Add React Query provider

Modify `app/layout.tsx`:

```typescript
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono"
});

const queryClient = new QueryClient();

export const metadata: Metadata = {
  title: "FansTrade - Follow the Best Traders",
  description: "Social trading platform powered by AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster position="top-right" />
        </QueryClientProvider>
      </body>
    </html>
  );
}
```

### Step 3: Fix layout to be client component

Create `app/providers.tsx`:

```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
}
```

Update `app/layout.tsx`:

```typescript
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono"
});

export const metadata: Metadata = {
  title: "FansTrade - Follow the Best Traders",
  description: "Social trading platform powered by AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

### Step 4: Test traders page

```bash
npm run dev
```

Navigate to http://localhost:3001/traders

Expected: Grid of 3 trader cards with follow buttons

### Step 5: Commit traders page

```bash
git add .
git commit -m "feat: create traders list page

- Grid layout with trader cards
- React Query provider setup
- Toast notifications
- Mock traders data

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 7: Update Next.js Port Configuration

**Files:**
- Create: `frontend/package.json` scripts

### Step 1: Update dev script to use port 3001

Modify `frontend/package.json` scripts section:

```json
{
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start -p 3001",
    "lint": "next lint"
  }
}
```

### Step 2: Test port configuration

```bash
npm run dev
```

Expected: Server running on http://localhost:3001

### Step 3: Commit configuration

```bash
git add package.json
git commit -m "config: set frontend port to 3001

- Avoid conflict with backend on port 3000
- Update dev and start scripts

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Completion Checklist

- [ ] Task 1: Next.js project structure ✅
- [ ] Task 2: ZeroAI-UI dark theme ✅
- [ ] Task 3: API client and state management ✅
- [ ] Task 4: Core UI components ✅
- [ ] Task 5: Home page with hero ✅
- [ ] Task 6: Traders list page ✅
- [ ] Task 7: Port configuration ✅

---

## Next Steps (Phase 2)

1. **Trader Detail Page** - `/traders/[id]`
2. **Auth Modal** - Login/Register
3. **Following Page** - View traders I follow
4. **Real API Integration** - Connect to actual backend
5. **Mobile Responsive** - Test on mobile devices
6. **Performance Optimization** - Lazy loading, image optimization

---

## Testing

### Manual Testing Checklist
- [ ] Home page loads with hero
- [ ] Traders page shows 3 cards
- [ ] Follow button works (shows login message)
- [ ] Navbar links work
- [ ] Dark theme applied correctly
- [ ] Animations smooth
- [ ] Mobile responsive

### Browser Testing
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Mobile Chrome
- [ ] Mobile Safari

---

## Estimated Time

- **Task 1-3**: 1-2 hours (Setup)
- **Task 4-6**: 2-3 hours (UI Components)
- **Task 7**: 30 minutes (Configuration)
- **Total**: 4-6 hours

---

## Notes

- Backend API must be running on port 3000
- Frontend runs on port 3001
- CORS must be configured in backend
- JWT token stored in localStorage
- Dark theme enforced via `className="dark"` on html element
