import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import path from 'path';
import { readFileSync } from 'fs';

// 支持的语言
export const locales = ['zh', 'en'] as const;
export type Locale = (typeof locales)[number];

// 默认语言
export const defaultLocale: Locale = 'zh';

export default getRequestConfig(async ({ locale }) => {
  // 验证传入的 locale 参数
  if (!locales.includes(locale as Locale)) notFound();

  // Use absolute path for production standalone builds
  const messagesPath = path.join(process.cwd(), 'messages', `${locale}.json`);
  const messages = JSON.parse(readFileSync(messagesPath, 'utf-8'));

  return {
    locale: locale as string,
    messages,
  };
});
