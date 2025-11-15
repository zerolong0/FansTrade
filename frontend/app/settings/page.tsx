'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  User,
  Key,
  Bell,
  Shield,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/store/auth';

interface SettingItem {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  color: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, router, isHydrated]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const settingItems: SettingItem[] = [
    {
      icon: <Key className="w-6 h-6" />,
      title: 'API密钥管理',
      description: '管理您的币安API密钥，启用跟单交易功能',
      href: '/settings/api-keys',
      color: 'text-primary',
    },
    {
      icon: <User className="w-6 h-6" />,
      title: '个人资料',
      description: '编辑您的个人信息、头像和展示名称',
      href: '/settings/profile',
      color: 'text-secondary',
    },
    {
      icon: <Bell className="w-6 h-6" />,
      title: '通知设置',
      description: '管理交易信号通知和提醒偏好',
      href: '/settings/notifications',
      color: 'text-yellow-400',
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: '安全设置',
      description: '修改密码、启用双因素认证',
      href: '/settings/security',
      color: 'text-green-400',
    },
  ];

  if (!isHydrated || !isAuthenticated) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse text-primary text-xl">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="container mx-auto px-4 py-12 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold gradient-text mb-2">设置</h1>
          <p className="text-gray-400">管理您的账户和偏好设置</p>
        </motion.div>

        {/* User Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16 ring-4 ring-primary/30">
                    <AvatarImage src={user?.avatarUrl || undefined} />
                    <AvatarFallback className="bg-gradient-primary text-black font-bold text-xl">
                      {user?.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div>
                    <h2 className="text-2xl font-bold gradient-text">
                      {user?.displayName || user?.username}
                    </h2>
                    <p className="text-gray-400">@{user?.username}</p>
                    <p className="text-sm text-gray-500 mt-1">{user?.email}</p>
                  </div>
                </div>

                <Button variant="destructive" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  退出登录
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Settings Items */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {settingItems.map((item, index) => (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <Card
                className="glass cursor-pointer hover:bg-white/10 transition-all group"
                onClick={() => router.push(item.href)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`${item.color} p-3 rounded-lg bg-white/5`}>
                        {item.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold mb-1">{item.title}</h3>
                        <p className="text-sm text-gray-400">{item.description}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-primary transition-colors" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="glass border-red-500/20">
            <CardHeader>
              <CardTitle className="text-red-400">危险区域</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-red-500/10">
                  <div>
                    <h3 className="font-semibold text-white mb-1">删除账户</h3>
                    <p className="text-sm text-gray-400">
                      永久删除您的账户和所有相关数据。此操作无法撤销。
                    </p>
                  </div>
                  <Button variant="destructive" disabled>
                    删除账户
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
