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
