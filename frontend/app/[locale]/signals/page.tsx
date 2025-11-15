'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  DollarSign,
  Activity,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/lib/store/auth';
import { signalsAPI, copyTradeAPI } from '@/lib/api/client';
import type { TradingSignal } from '@/lib/api/types';

export default function SignalsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [filteredSignals, setFilteredSignals] = useState<TradingSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState<string | null>(null);
  const [filterSymbol, setFilterSymbol] = useState('');
  const [filterType, setFilterType] = useState<string>('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadSignals();
  }, [isAuthenticated, router]);

  useEffect(() => {
    filterSignals();
  }, [signals, filterSymbol, filterType]);

  const loadSignals = async () => {
    try {
      const response = await signalsAPI.getSignals({ status: 'PENDING', limit: 50 });
      setSignals(response.data.signals);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load signals:', error);
      setSignals([]);
      setLoading(false);
    }
  };

  const filterSignals = () => {
    let filtered = [...signals];

    if (filterSymbol) {
      filtered = filtered.filter((signal) =>
        signal.symbol.toLowerCase().includes(filterSymbol.toLowerCase())
      );
    }

    if (filterType) {
      filtered = filtered.filter((signal) => signal.signalType === filterType);
    }

    setFilteredSignals(filtered);
  };

  const handleExecuteTrade = async (signalId: string, symbol: string) => {
    if (executing) return;

    const amount = prompt(`Enter amount in USDT to invest in ${symbol}:`, '100');
    if (!amount || isNaN(Number(amount))) return;

    setExecuting(signalId);

    try {
      const response = await copyTradeAPI.executeTrade({
        signalId,
        amount: Number(amount),
      });

      if (response.data.success) {
        alert(`Trade executed successfully! Order ID: ${response.data.orderId}`);
        loadSignals(); // Refresh signals
      } else {
        alert('Trade execution failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Trade execution error:', error);
      alert(`Trade execution failed: ${error.response?.data?.message || error.message}`);
    } finally {
      setExecuting(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse text-primary text-xl">Loading signals...</div>
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
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">Trading Signals</h1>
            <p className="text-gray-400">
              Active signals from traders you follow • Click to execute copy trade
            </p>
          </div>

          <Button onClick={loadSignals} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
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
                placeholder="e.g., BTCUSDT, ETHUSDT"
                value={filterSymbol}
                onChange={(e) => setFilterSymbol(e.target.value)}
                className="bg-black/20"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-2 block">Signal Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:border-primary focus:outline-none"
              >
                <option value="">All Types</option>
                <option value="STRONG_BUY">Strong Buy</option>
                <option value="BUY">Buy</option>
                <option value="NEUTRAL">Neutral</option>
                <option value="SELL">Sell</option>
                <option value="STRONG_SELL">Strong Sell</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Signals Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredSignals.map((signal, index) => (
            <SignalCard
              key={signal.id}
              signal={signal}
              index={index}
              executing={executing === signal.id}
              onExecute={() => handleExecuteTrade(signal.id, signal.symbol)}
            />
          ))}
        </div>

        {filteredSignals.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 glass rounded-xl"
          >
            <Activity className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Active Signals</h3>
            <p className="text-gray-400 mb-6">
              {filterSymbol || filterType
                ? 'No signals match your filters'
                : 'No trading signals available at the moment'}
            </p>
            {(filterSymbol || filterType) && (
              <Button
                onClick={() => {
                  setFilterSymbol('');
                  setFilterType('');
                }}
              >
                Clear Filters
              </Button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function SignalCard({
  signal,
  index,
  executing,
  onExecute,
}: {
  signal: TradingSignal;
  index: number;
  executing: boolean;
  onExecute: () => void;
}) {
  const getSignalColor = (type: string) => {
    switch (type) {
      case 'STRONG_BUY':
        return 'text-green-400 bg-green-400/10 border-green-400/30';
      case 'BUY':
        return 'text-green-300 bg-green-300/10 border-green-300/30';
      case 'NEUTRAL':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
      case 'SELL':
        return 'text-red-300 bg-red-300/10 border-red-300/30';
      case 'STRONG_SELL':
        return 'text-red-400 bg-red-400/10 border-red-400/30';
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
    }
  };

  const getSignalIcon = (type: string) => {
    if (type.includes('BUY')) return <TrendingUp className="w-5 h-5" />;
    if (type.includes('SELL')) return <TrendingDown className="w-5 h-5" />;
    return <Minus className="w-5 h-5" />;
  };

  const formatTimeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const colorClasses = getSignalColor(signal.signalType);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="glass hover:bg-white/5 transition-all cursor-pointer group">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg border ${colorClasses}`}>
                {getSignalIcon(signal.signalType)}
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">{signal.symbol}</h3>
                <span className={`text-sm font-semibold ${colorClasses.split(' ')[0]}`}>
                  {signal.signalType.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-2xl font-bold">${parseFloat(signal.price).toFixed(2)}</div>
              <div className="text-xs text-gray-500 flex items-center gap-1 justify-end mt-1">
                <Clock className="w-3 h-3" />
                {formatTimeAgo(signal.createdAt)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="glass rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">Confidence</div>
              <div className="text-lg font-bold">{(signal.confidence * 100).toFixed(1)}%</div>
            </div>
            <div className="glass rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">Status</div>
              <div className="text-lg font-bold capitalize">{signal.status.toLowerCase()}</div>
            </div>
          </div>

          {signal.indicators && Object.keys(signal.indicators).length > 0 && (
            <div className="mb-4 p-3 bg-black/20 rounded-lg">
              <div className="text-xs text-gray-400 mb-2">Technical Indicators</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(signal.indicators).slice(0, 4).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-gray-500">{key}:</span>
                    <span className="text-white font-mono">
                      {typeof value === 'number' ? value.toFixed(2) : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={onExecute}
            disabled={executing}
            className="w-full"
            variant={signal.signalType.includes('BUY') ? 'default' : 'destructive'}
          >
            {executing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Executing...
              </>
            ) : (
              <>
                <DollarSign className="w-4 h-4 mr-2" />
                Execute Copy Trade
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
