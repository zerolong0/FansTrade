import { ReactNode } from 'react';
import { locales } from '@/i18n';

type Props = {
  children: ReactNode;
};

// 生成静态参数用于所有支持的语言
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default function RootLayout({ children }: Props) {
  return children;
}
