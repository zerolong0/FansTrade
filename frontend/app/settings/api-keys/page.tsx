'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Key,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ExternalLink,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/lib/store/auth';
import { binanceAPI } from '@/lib/api/client';
import type { BinanceApiKey } from '@/lib/api/types';

export default function ApiKeysPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);
  const [apiKeys, setApiKeys] = useState<BinanceApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    apiKey: '',
    apiSecret: '',
    label: '',
  });
  const [showSecret, setShowSecret] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadApiKeys();
  }, [isAuthenticated, router, isHydrated]);

  const loadApiKeys = async () => {
    try {
      const response = await binanceAPI.getApiKeys();
      setApiKeys(response.data.apiKeys);
    } catch (error: any) {
      console.error('Failed to load API keys:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.error || '加载API密钥失败',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await binanceAPI.addApiKey({
        apiKey: formData.apiKey,
        apiSecret: formData.apiSecret,
        label: formData.label || undefined,
      });

      setMessage({
        type: 'success',
        text: '币安API密钥绑定成功！',
      });

      // Reset form and reload keys
      setFormData({ apiKey: '', apiSecret: '', label: '' });
      setShowAddForm(false);
      await loadApiKeys();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || '绑定失败，请检查API密钥是否正确',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (keyId: string) => {
    if (!confirm('确定要删除此API密钥吗？删除后将无法恢复。')) {
      return;
    }

    try {
      await binanceAPI.deleteApiKey(keyId);
      setMessage({
        type: 'success',
        text: 'API密钥已删除',
      });
      await loadApiKeys();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || '删除失败',
      });
    }
  };

  const handleToggle = async (keyId: string, currentStatus: boolean) => {
    try {
      await binanceAPI.updateApiKey(keyId, { isActive: !currentStatus });
      setMessage({
        type: 'success',
        text: currentStatus ? 'API密钥已停用' : 'API密钥已激活',
      });
      await loadApiKeys();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || '更新失败',
      });
    }
  };


  if (!isHydrated || loading) {
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

      <div className="container mx-auto px-4 py-12 space-y-8 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button
            variant="ghost"
            onClick={() => router.push('/settings')}
            className="mb-4"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            返回设置
          </Button>

          <h1 className="text-4xl font-bold gradient-text mb-2">币安API密钥管理</h1>
          <p className="text-gray-400">安全管理您的币安API密钥，启用自动跟单交易功能</p>
        </motion.div>

        {/* Message */}
        {message.text && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}
          >
            <div className="flex items-center gap-2">
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
              {message.text}
            </div>
          </motion.div>
        )}

        {/* Security Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass border-yellow-500/20">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <AlertTriangle className="w-6 h-6 text-yellow-400 flex-shrink-0" />
                <div className="space-y-2 text-sm">
                  <h3 className="font-bold text-yellow-400">安全提示</h3>
                  <ul className="space-y-1 text-gray-300">
                    <li>• 您的API密钥将使用AES-256加密存储在我们的服务器上</li>
                    <li>• 创建API密钥时，请勿启用提现权限，仅启用现货交易权限</li>
                    <li>• 建议设置IP白名单以提高安全性</li>
                    <li>• 定期更换API密钥以确保账户安全</li>
                    <li>• 我们永远不会要求您的币安登录密码</li>
                  </ul>
                  <a
                    href="https://www.binance.com/zh-CN/support/faq/360002502072"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline mt-2"
                  >
                    如何创建币安API密钥？
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* API Keys List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-primary" />
                  我的API密钥
                </div>
                {!showAddForm && (
                  <Button
                    onClick={() => setShowAddForm(true)}
                    className="bg-gradient-primary border-2 border-primary/50 shadow-lg shadow-primary/20 hover:shadow-primary/40"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    添加新密钥
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {showAddForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 p-6 rounded-lg bg-white/5 border border-primary/20"
                >
                  <h3 className="text-lg font-bold mb-4">添加币安API密钥</h3>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="label">标签（可选）</Label>
                      <Input
                        id="label"
                        type="text"
                        value={formData.label}
                        onChange={(e) =>
                          setFormData({ ...formData, label: e.target.value })
                        }
                        placeholder="例如：主账户"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="apiKey">
                        API Key <span className="text-red-400">*</span>
                      </Label>
                      <Input
                        id="apiKey"
                        type="text"
                        required
                        value={formData.apiKey}
                        onChange={(e) =>
                          setFormData({ ...formData, apiKey: e.target.value })
                        }
                        placeholder="输入您的币安API Key"
                        className="mt-1 font-mono"
                      />
                    </div>

                    <div>
                      <Label htmlFor="apiSecret">
                        API Secret <span className="text-red-400">*</span>
                      </Label>
                      <div className="relative mt-1">
                        <Input
                          id="apiSecret"
                          type={showSecret ? 'text' : 'password'}
                          required
                          value={formData.apiSecret}
                          onChange={(e) =>
                            setFormData({ ...formData, apiSecret: e.target.value })
                          }
                          placeholder="输入您的币安API Secret"
                          className="font-mono pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSecret(!showSecret)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          {showSecret ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button
                        type="submit"
                        disabled={submitting}
                        className="bg-gradient-primary"
                      >
                        {submitting ? '验证中...' : '绑定密钥'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowAddForm(false);
                          setFormData({ apiKey: '', apiSecret: '', label: '' });
                          setMessage({ type: '', text: '' });
                        }}
                      >
                        取消
                      </Button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* Keys List */}
              <div className="space-y-4">
                {apiKeys.length === 0 ? (
                  <div className="text-center py-12">
                    <Key className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 mb-4">您还没有绑定任何API密钥</p>
                    {!showAddForm && (
                      <Button
                        onClick={() => setShowAddForm(true)}
                        className="bg-gradient-primary border-2 border-primary/50 shadow-lg shadow-primary/20 hover:shadow-primary/40"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        添加第一个密钥
                      </Button>
                    )}
                  </div>
                ) : (
                  apiKeys.map((key, index) => (
                    <motion.div
                      key={key.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="glass rounded-lg p-4 hover:bg-white/10 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-white">
                              {key.label || '未命名密钥'}
                            </h3>
                            {key.isActive ? (
                              <span className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-green-500/20 text-green-400">
                                <CheckCircle className="w-3 h-3" />
                                激活中
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-gray-500/20 text-gray-400">
                                <XCircle className="w-3 h-3" />
                                已停用
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-400">
                            API密钥ID: {key.id.slice(0, 8)}...
                          </p>
                          <div className="flex gap-4 text-xs text-gray-500 mt-1">
                            <span>
                              创建于 {new Date(key.createdAt).toLocaleDateString()}
                            </span>
                            {key.lastUsedAt && (
                              <span>
                                最后使用 {new Date(key.lastUsedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggle(key.id, key.isActive)}
                          >
                            {key.isActive ? '停用' : '激活'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(key.id)}
                            className="hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
