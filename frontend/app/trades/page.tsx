'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/lib/store/auth';
import { copyTradeAPI } from '@/lib/api/client';
import type { TradeRecord, PaginatedTradeHistory } from '@/lib/api/types';

export default function TradesPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSymbol, setFilterSymbol] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadTrades();
  }, [isAuthenticated, router, pagination.page, filterStatus, filterSymbol]);

  const loadTrades = async () => {
    try {
      const response = await copyTradeAPI.getHistory({
        page: pagination.page,
        limit: pagination.limit,
        status: filterStatus || undefined,
        symbol: filterSymbol || undefined,
      });

      setTrades(response.data.trades);
      setPagination(response.data.pagination);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load trades:', error);
      setTrades([]);
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse text-primary text-xl">Loading trade history...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="container mx-auto px-4 py-12 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold gradient-text mb-2">Trade History</h1>
          <p className="text-gray-400">
            View all your copy trade transactions and their performance
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Symbol</label>
              <Input
                placeholder="e.g., BTCUSDT"
                value={filterSymbol}
                onChange={(e) => {
                  setFilterSymbol(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="bg-black/20"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-2 block">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:border-primary focus:outline-none"
              >
                <option value="">All Status</option>
                <option value="FILLED">Filled</option>
                <option value="FAILED">Failed</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Trades"
            value={pagination.total.toString()}
            icon={<Activity className="w-5 h-5" />}
            color="primary"
          />
          <StatCard
            label="Filled"
            value={trades.filter((t) => t.status === 'FILLED').length.toString()}
            icon={<CheckCircle className="w-5 h-5" />}
            color="green"
          />
          <StatCard
            label="Failed"
            value={trades.filter((t) => t.status === 'FAILED').length.toString()}
            icon={<XCircle className="w-5 h-5" />}
            color="red"
          />
          <StatCard
            label="Pending"
            value={trades.filter((t) => t.status === 'PENDING').length.toString()}
            icon={<Clock className="w-5 h-5" />}
            color="yellow"
          />
        </div>

        {/* Trades List */}
        <div className="space-y-4">
          {trades.map((trade, index) => (
            <TradeCard key={trade.id} trade={trade} index={index} />
          ))}
        </div>

        {trades.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 glass rounded-xl"
          >
            <Activity className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Trades Found</h3>
            <p className="text-gray-400 mb-6">
              {filterStatus || filterSymbol
                ? 'No trades match your filters'
                : 'You haven\'t made any copy trades yet'}
            </p>
            {(filterStatus || filterSymbol) && (
              <Button
                onClick={() => {
                  setFilterStatus('');
                  setFilterSymbol('');
                }}
              >
                Clear Filters
              </Button>
            )}
          </motion.div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-2"
          >
            <Button
              variant="outline"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <span className="text-sm text-gray-400">
              Page {pagination.page} of {pagination.totalPages}
            </span>

            <Button
              variant="outline"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  const colorClasses = {
    primary: 'text-primary',
    green: 'text-green-400',
    red: 'text-red-400',
    yellow: 'text-yellow-400',
  };

  return (
    <Card className="glass">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-400 mb-1">{label}</div>
            <div className="text-2xl font-bold">{value}</div>
          </div>
          <div className={colorClasses[color as keyof typeof colorClasses]}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function TradeCard({ trade, index }: { trade: TradeRecord; index: number }) {
  const isBuy = trade.side === 'BUY';
  const isSuccess = trade.status === 'FILLED';
  const isPending = trade.status === 'PENDING';

  const executedValue = parseFloat(trade.executedValue);
  const realizedPnl = trade.realizedPnl ? parseFloat(trade.realizedPnl) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <Card className="glass hover:bg-white/5 transition-all">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* Left: Trade Info */}
            <div className="flex items-start gap-4 flex-1">
              <div
                className={`p-3 rounded-lg ${
                  isBuy ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'
                }`}
              >
                {isBuy ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-bold">{trade.symbol}</h3>
                  <span
                    className={`px-2 py-1 text-xs rounded-full font-semibold ${
                      isBuy
                        ? 'bg-green-400/20 text-green-400'
                        : 'bg-red-400/20 text-red-400'
                    }`}
                  >
                    {trade.side}
                  </span>
                  <span
                    className={`px-2 py-1 text-xs rounded-full font-semibold ${
                      isSuccess
                        ? 'bg-green-400/20 text-green-400'
                        : isPending
                        ? 'bg-yellow-400/20 text-yellow-400'
                        : 'bg-red-400/20 text-red-400'
                    }`}
                  >
                    {trade.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 text-sm mt-3">
                  <div>
                    <div className="text-gray-500">Price</div>
                    <div className="font-mono">${parseFloat(trade.executedPrice).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Quantity</div>
                    <div className="font-mono">{parseFloat(trade.executedQty).toFixed(6)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Value</div>
                    <div className="font-mono">${executedValue.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Mode</div>
                    <div className="capitalize">{trade.mode}</div>
                  </div>
                </div>

                {trade.closedAt && realizedPnl !== null && (
                  <div className="mt-3 p-3 bg-black/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-gray-500">Realized P&L</div>
                        <div
                          className={`text-lg font-bold ${
                            realizedPnl >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}
                        >
                          {realizedPnl >= 0 ? '+' : ''}${realizedPnl.toFixed(2)} (
                          {trade.realizedPnlPct?.toFixed(2)}%)
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Close Price</div>
                        <div className="font-mono">${parseFloat(trade.closePrice!).toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                )}

                {trade.errorMessage && (
                  <div className="mt-3 p-3 bg-red-400/10 border border-red-400/30 rounded-lg">
                    <div className="text-xs text-red-400">{trade.errorMessage}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Metadata */}
            <div className="text-right text-sm space-y-1">
              <div className="text-gray-500">Order ID</div>
              <div className="font-mono text-xs">{trade.binanceOrderId}</div>
              <div className="text-gray-500 mt-2">Created</div>
              <div className="text-xs">{new Date(trade.createdAt).toLocaleString()}</div>
              {trade.executedAt && (
                <>
                  <div className="text-gray-500 mt-2">Executed</div>
                  <div className="text-xs">{new Date(trade.executedAt).toLocaleString()}</div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
