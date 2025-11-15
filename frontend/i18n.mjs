import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

// 支持的语言
export const locales = ['zh', 'en'];

// 默认语言
export const defaultLocale = 'zh';

export default getRequestConfig(async ({ locale }) => {
  // 验证传入的 locale 参数
  if (!locales.includes(locale)) notFound();

  return {
    locale,
    messages: (await import(`./app/messages/${locale}.json`)).default,
  };
});
