'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';

export default function TestLoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✅ 登录成功！欢迎回来，${data.user.username}！`);

        // Use Zustand store's setAuth method to properly set state and persist
        setAuth(data.user, data.token);

        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      } else {
        setMessage(`❌ 登录失败: ${data.error}`);
      }
    } catch (error: any) {
      setMessage(`❌ 错误: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-black">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-cyan-400 mb-8 text-center">
          测试登录页面
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4 bg-gray-900 p-8 rounded-lg">
          <div>
            <label className="block text-gray-300 mb-2">邮箱</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-cyan-500 focus:outline-none"
              placeholder="demo@fanstrade.com"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2">密码</label>
            <input
              type="password"
              required
              minLength={6}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-cyan-500 focus:outline-none"
              placeholder="Demo123456"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-cyan-500 text-black font-bold rounded hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '登录中...' : '登录'}
          </button>

          {message && (
            <div className={`mt-4 p-4 rounded ${message.startsWith('✅') ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
              {message}
            </div>
          )}
        </form>

        <p className="text-gray-500 text-sm mt-4 text-center">
          这是一个简化的测试页面，使用原生 React state 而不是 React Hook Form
        </p>
      </div>
    </div>
  );
}
