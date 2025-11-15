'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { UserPlus, Mail, Lock, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { authAPI } from '@/lib/api/client';
import { useAuthStore } from '@/lib/store/auth';

const registerSchema = z
  .object({
    email: z.string().email('请输入有效的邮箱地址'),
    username: z
      .string()
      .min(3, '用户名至少需要3个字符')
      .max(20, '用户名最多20个字符')
      .regex(/^[a-zA-Z0-9_-]+$/, '用户名只能包含字母、数字、下划线和连字符'),
    password: z.string().min(6, '密码至少需要6个字符'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '两次输入的密码不一致',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const { confirmPassword, ...registerData } = data;
      const response = await authAPI.register(registerData);
      const { user, token } = response.data;

      setAuth(user, token);
      toast.success('注册成功！欢迎加入 FansTrade');
      router.push('/dashboard');
    } catch (error: any) {
      const message = error.response?.data?.error || '注册失败，请稍后重试';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Background Grid */}
      <div className="fixed inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 240, 255, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 240, 255, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-4xl font-bold gradient-text mb-2">FansTrade</h1>
            <p className="text-gray-400">创建您的交易账户</p>
          </motion.div>
        </div>

        {/* Register Form Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-8 shadow-2xl relative overflow-hidden"
        >
          {/* Neon Border Glow */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 via-transparent to-secondary/20 pointer-events-none" />

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 relative">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                邮箱地址
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  {...register('email')}
                  id="email"
                  type="email"
                  autoComplete="email"
                  className={`
                    block w-full pl-10 pr-3 py-3
                    glass rounded-lg
                    text-white placeholder-gray-500
                    focus:outline-none focus:ring-2 focus:ring-primary/50
                    transition-all duration-200
                    ${errors.email ? 'ring-2 ring-red-500/50' : ''}
                  `}
                  placeholder="your@email.com"
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
              )}
            </div>

            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                用户名
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  {...register('username')}
                  id="username"
                  type="text"
                  autoComplete="username"
                  className={`
                    block w-full pl-10 pr-3 py-3
                    glass rounded-lg
                    text-white placeholder-gray-500
                    focus:outline-none focus:ring-2 focus:ring-primary/50
                    transition-all duration-200
                    ${errors.username ? 'ring-2 ring-red-500/50' : ''}
                  `}
                  placeholder="username"
                  disabled={isLoading}
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-sm text-red-400">{errors.username.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                密码
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  {...register('password')}
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  className={`
                    block w-full pl-10 pr-3 py-3
                    glass rounded-lg
                    text-white placeholder-gray-500
                    focus:outline-none focus:ring-2 focus:ring-primary/50
                    transition-all duration-200
                    ${errors.password ? 'ring-2 ring-red-500/50' : ''}
                  `}
                  placeholder="••••••••"
                  disabled={isLoading}
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                确认密码
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  {...register('confirmPassword')}
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  className={`
                    block w-full pl-10 pr-3 py-3
                    glass rounded-lg
                    text-white placeholder-gray-500
                    focus:outline-none focus:ring-2 focus:ring-primary/50
                    transition-all duration-200
                    ${errors.confirmPassword ? 'ring-2 ring-red-500/50' : ''}
                  `}
                  placeholder="••••••••"
                  disabled={isLoading}
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-400">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="
                w-full py-3 px-4
                bg-gradient-to-r from-primary to-secondary
                text-black font-bold rounded-lg
                hover:shadow-[0_0_20px_rgba(0,240,255,0.5)]
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-300
                flex items-center justify-center gap-2
              "
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>注册中...</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-5 w-5" />
                  <span>注册</span>
                </>
              )}
            </motion.button>

            {/* Terms */}
            <p className="text-xs text-gray-500 text-center">
              注册即表示您同意我们的{' '}
              <Link href="/terms" className="text-primary hover:underline">
                服务条款
              </Link>{' '}
              和{' '}
              <Link href="/privacy" className="text-primary hover:underline">
                隐私政策
              </Link>
            </p>
          </form>
        </motion.div>

        {/* Login Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-center"
        >
          <p className="text-gray-400">
            已有账户？{' '}
            <Link
              href="/login"
              className="text-primary hover:text-secondary transition-colors font-medium"
            >
              立即登录
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
