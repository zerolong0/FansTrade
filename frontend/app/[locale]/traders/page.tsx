import { TradersPageClient } from './TradersPageClient';

// Force dynamic rendering to resolve i18n issues
export const dynamic = 'force-dynamic';

export default function TradersPage() {
  return <TradersPageClient />;
}
