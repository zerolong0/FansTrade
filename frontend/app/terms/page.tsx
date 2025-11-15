'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { FileText, ArrowLeft } from 'lucide-react';

export default function TermsPage() {
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
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-4">服务条款</h1>
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
              <h2 className="text-2xl font-bold text-white mb-4">1. 接受条款</h2>
              <p className="mb-4">
                欢迎使用 FansTrade。通过访问或使用我们的服务，您同意遵守本服务条款（以下简称"条款"）。如果您不同意这些条款，请不要使用我们的服务。
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. 服务描述</h2>
              <p className="mb-4">
                FansTrade 是一个加密货币社交交易平台，提供以下服务：
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>交易员展示和排行榜</li>
                <li>跟单交易功能</li>
                <li>交易信号分析</li>
                <li>AI 辅助交易建议</li>
                <li>与 Binance 的 API 集成</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. 用户资格</h2>
              <p className="mb-4">
                使用我们的服务，您必须：
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>年满 18 周岁或以上</li>
                <li>拥有合法的 Binance 账户</li>
                <li>遵守您所在地区的加密货币交易法律法规</li>
                <li>提供准确、真实的注册信息</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. 账户责任</h2>
              <p className="mb-4">您同意：</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>对您的账户安全负全部责任</li>
                <li>妥善保管 API 密钥和登录凭证</li>
                <li>及时通知我们任何未经授权的访问</li>
                <li>不与他人共享您的账户</li>
                <li>对您账户下的所有活动承担责任</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. 交易风险披露</h2>
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
                <p className="font-bold text-red-400 mb-2">重要风险警告</p>
                <p className="text-sm">
                  加密货币交易具有高风险性，可能导致全部本金损失。跟单交易并不保证盈利。过往表现不代表未来收益。请仅投资您可以承受损失的资金。
                </p>
              </div>
              <p className="mb-4">您理解并承认：</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>加密货币市场高度波动</li>
                <li>跟单交易可能导致损失</li>
                <li>我们不提供投资建议</li>
                <li>您需要进行自己的研究和尽职调查</li>
                <li>所有交易决策均由您自行承担责任</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. API 密钥使用</h2>
              <p className="mb-4">关于 Binance API 密钥：</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>我们仅使用您的 API 密钥执行授权的交易操作</li>
                <li>强烈建议您仅授予"交易"权限，不开启"提现"权限</li>
                <li>您可以随时撤销或更新 API 密钥</li>
                <li>我们采用行业标准加密技术保护 API 密钥</li>
                <li>您需自行承担 API 密钥泄露的风险</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">7. 禁止行为</h2>
              <p className="mb-4">您不得：</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>使用自动化工具或机器人滥用服务</li>
                <li>尝试未经授权访问他人账户</li>
                <li>上传恶意代码或病毒</li>
                <li>进行市场操纵或欺诈活动</li>
                <li>违反任何适用的法律法规</li>
                <li>干扰或破坏平台的正常运行</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">8. 知识产权</h2>
              <p className="mb-4">
                FansTrade 平台及其所有内容（包括但不限于软件、设计、商标、标识）均为我们的知识产权。未经许可，您不得复制、修改、分发或创建衍生作品。
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">9. 免责声明</h2>
              <p className="mb-4">
                我们的服务按"现状"提供，不提供任何明示或暗示的保证。我们不保证：
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>服务不会中断或无错误</li>
                <li>数据的准确性或可靠性</li>
                <li>通过服务获得的任何投资收益</li>
                <li>第三方服务（如 Binance API）的可用性</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">10. 责任限制</h2>
              <p className="mb-4">
                在法律允许的最大范围内，我们对以下情况不承担责任：
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>任何直接、间接、偶然或后果性损失</li>
                <li>交易损失或利润损失</li>
                <li>数据丢失或服务中断</li>
                <li>第三方行为或服务故障</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">11. 赔偿</h2>
              <p className="mb-4">
                您同意赔偿并使我们免受因您违反本条款或滥用服务而引起的任何索赔、损失、责任、费用（包括律师费）的损害。
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">12. 服务变更和终止</h2>
              <p className="mb-4">我们保留以下权利：</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>随时修改或终止服务（或其任何部分）</li>
                <li>暂停或终止违反条款的用户账户</li>
                <li>更新这些服务条款</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">13. 条款变更</h2>
              <p className="mb-4">
                我们可能会不时更新这些服务条款。重大变更时，我们会通过邮件或平台通知您。继续使用服务即表示您接受修订后的条款。
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">14. 适用法律</h2>
              <p className="mb-4">
                本条款受中华人民共和国法律管辖（不包括其冲突法规则）。任何争议应提交至我们所在地的有管辖权的法院。
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">15. 联系我们</h2>
              <p className="mb-4">
                如果您对本服务条款有任何疑问，请通过以下方式联系我们：
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>邮箱：legal@fanstrade.com</li>
                <li>在线支持：通过平台内的帮助中心</li>
              </ul>
            </section>

            <section className="border-t border-gray-700 pt-6">
              <p className="text-sm text-gray-500">
                本服务条款于 2025 年 1 月生效。通过使用
                FansTrade，您确认已阅读、理解并同意受这些条款的约束。
              </p>
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
            <Link href="/privacy" className="hover:text-primary transition-colors">
              隐私政策
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
