'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Shield, ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen p-4 md:p-8">
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

      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>返回首页</span>
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full glass mb-4">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-4">隐私政策</h1>
          <p className="text-gray-400">最后更新时间：2025年1月</p>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="glass rounded-2xl p-8 md:p-12 relative overflow-hidden"
        >
          {/* Neon Border Glow */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 pointer-events-none" />

          <div className="relative space-y-8 text-gray-300">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. 信息收集</h2>
              <p className="mb-4">
                FansTrade（以下简称"我们"）致力于保护您的隐私。我们收集以下类型的信息：
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>账户信息：邮箱地址、用户名</li>
                <li>交易信息：Binance API 密钥（加密存储）、交易历史</li>
                <li>使用数据：访问日志、IP 地址、设备信息</li>
                <li>技术数据：Cookie、浏览器类型、操作系统</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. 信息使用</h2>
              <p className="mb-4">我们使用收集的信息用于：</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>提供和改进我们的社交交易服务</li>
                <li>执行跟单交易和信号分析</li>
                <li>与您进行沟通（账户通知、服务更新）</li>
                <li>保护平台安全，防止欺诈行为</li>
                <li>遵守法律法规要求</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. API 密钥安全</h2>
              <p className="mb-4">
                您的 Binance API 密钥安全是我们的首要任务：
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>所有 API 密钥使用 AES-256 加密存储</li>
                <li>密钥仅用于授权的交易操作</li>
                <li>我们建议您仅授予"交易"权限，不开启"提现"权限</li>
                <li>您可以随时撤销或更新 API 密钥</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. 信息共享</h2>
              <p className="mb-4">
                我们不会出售您的个人信息。我们可能在以下情况下共享信息：
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>与 Binance API 进行必要的交易通信</li>
                <li>遵守法律义务或响应法律程序</li>
                <li>保护我们的权利、财产或安全</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. 数据安全</h2>
              <p className="mb-4">
                我们采取行业标准的安全措施保护您的数据：
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>HTTPS 加密传输</li>
                <li>数据库加密存储</li>
                <li>定期安全审计</li>
                <li>访问控制和身份验证</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. 您的权利</h2>
              <p className="mb-4">您拥有以下权利：</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>访问和下载您的个人数据</li>
                <li>更正不准确的信息</li>
                <li>删除您的账户和数据</li>
                <li>撤销 API 密钥授权</li>
                <li>反对或限制某些数据处理</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">7. Cookie 使用</h2>
              <p className="mb-4">
                我们使用 Cookie 和类似技术来提供和改进服务。您可以通过浏览器设置管理 Cookie
                偏好。
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">8. 儿童隐私</h2>
              <p className="mb-4">
                我们的服务不面向 18 岁以下的儿童。我们不会有意收集儿童的个人信息。
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">9. 政策更新</h2>
              <p className="mb-4">
                我们可能会不时更新本隐私政策。重大变更时，我们会通过邮件或平台通知您。
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">10. 联系我们</h2>
              <p className="mb-4">
                如果您对本隐私政策有任何疑问，请通过以下方式联系我们：
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>邮箱：privacy@fanstrade.com</li>
                <li>地址：请查看我们的服务条款</li>
              </ul>
            </section>
          </div>
        </motion.div>

        {/* Footer Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 text-center"
        >
          <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
            <Link href="/terms" className="hover:text-primary transition-colors">
              服务条款
            </Link>
            <span>·</span>
            <Link href="/" className="hover:text-primary transition-colors">
              返回首页
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
