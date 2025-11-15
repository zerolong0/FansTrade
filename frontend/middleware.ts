import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n.mjs';

export default createMiddleware({
  // 所有支持的语言
  locales,

  // 默认语言
  defaultLocale,

  // 语言检测策略
  localeDetection: true,

  // URL 策略：始终显示语言前缀
  localePrefix: 'always',
});

export const config = {
  // 匹配所有路径，除了这些
  matcher: [
    // 匹配所有路径
    '/((?!api|_next|_vercel|.*\\..*).*)',
    // 也支持根路径和本地化路径
    '/',
    '/(zh|en)/:path*',
  ],
};
