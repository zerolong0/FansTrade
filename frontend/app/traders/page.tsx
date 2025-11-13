'use client';

import { useQuery } from '@tanstack/react-query';
import { Navbar } from '@/components/layout/Navbar';
import { TraderCard } from '@/components/traders/TraderCard';
import { Skeleton } from '@/components/ui/skeleton';
import { tradersAPI } from '@/lib/api/traders';

export default function TradersPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['traders'],
    queryFn: async () => {
      const response = await tradersAPI.getTraders(20, 0);
      return response.data;
    },
  });

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

        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-red-400">Failed to load traders. Please try again.</p>
          </div>
        )}

        {data && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.traders.map((trader) => (
              <TraderCard key={trader.id} trader={trader} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
