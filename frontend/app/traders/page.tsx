'use client';

import { Navbar } from '@/components/layout/Navbar';
import { TraderCard } from '@/components/traders/TraderCard';

export default function TradersPage() {
  // Mock traders data (replace with real API later)
  const traders = [
    {
      id: '1',
      username: 'cryptowhale',
      displayName: 'Crypto Whale',
      avatarUrl: null,
      isVerified: true,
      _count: { followers: 1234 },
    },
    {
      id: '2',
      username: 'btcmaster',
      displayName: 'BTC Master',
      avatarUrl: null,
      isVerified: true,
      _count: { followers: 890 },
    },
    {
      id: '3',
      username: 'ethtrader',
      displayName: 'ETH Trader',
      avatarUrl: null,
      isVerified: false,
      _count: { followers: 567 },
    },
  ];

  return (
    <main className="min-h-screen">
      <Navbar />

      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-glow">Top Traders</h1>
          <p className="text-muted-foreground">
            Follow the best crypto traders and learn from their strategies
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {traders.map((trader) => (
            <TraderCard key={trader.id} trader={trader} />
          ))}
        </div>
      </div>
    </main>
  );
}
