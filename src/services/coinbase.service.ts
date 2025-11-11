import crypto from 'crypto';

/**
 * Coinbase Advanced Trade API Client
 * Documentation: https://docs.cdp.coinbase.com/advanced-trade/docs/welcome
 */

const BASE_URL = process.env.COINBASE_API_URL || 'https://api.coinbase.com/api/v3/brokerage';

interface CoinbaseCredentials {
  apiKey: string;
  apiSecret: string;
}

interface AccountBalance {
  currency: string;
  available: string;
  hold: string;
  total: string;
}

interface Position {
  symbol: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  unrealizedPnl: number;
  unrealizedPnlPercentage: number;
}

interface Trade {
  id: string;
  product_id: string;
  side: 'buy' | 'sell';
  size: string;
  price: string;
  timestamp: string;
  fee: string;
}

export class CoinbaseService {
  private apiKey: string;
  private apiSecret: string;

  constructor(credentials: CoinbaseCredentials) {
    this.apiKey = credentials.apiKey;
    this.apiSecret = credentials.apiSecret;
  }

  /**
   * Generate authentication signature for Coinbase API
   * Method: HMAC-SHA256
   */
  private generateSignature(timestamp: string, method: string, path: string, body: string = ''): string {
    const message = timestamp + method.toUpperCase() + path + body;
    const hmac = crypto.createHmac('sha256', this.apiSecret);
    return hmac.update(message).digest('base64');
  }

  /**
   * Make authenticated request to Coinbase API
   */
  private async request<T>(
    method: string,
    endpoint: string,
    body?: any
  ): Promise<T> {
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${BASE_URL}${path}`;
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const bodyString = body ? JSON.stringify(body) : '';

    const signature = this.generateSignature(timestamp, method, `/api/v3/brokerage${path}`, bodyString);

    const headers: Record<string, string> = {
      'CB-ACCESS-KEY': this.apiKey,
      'CB-ACCESS-SIGN': signature,
      'CB-ACCESS-TIMESTAMP': timestamp,
      'Content-Type': 'application/json',
    };

    const options: RequestInit = {
      method,
      headers,
      body: bodyString || undefined,
    };

    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Coinbase API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      console.error('Coinbase API request failed:', error);
      throw error;
    }
  }

  /**
   * Get all account balances
   */
  async getAccounts(): Promise<AccountBalance[]> {
    interface AccountsResponse {
      accounts: Array<{
        uuid: string;
        name: string;
        currency: string;
        available_balance: { value: string; currency: string };
        hold: { value: string; currency: string };
      }>;
    }

    const response = await this.request<AccountsResponse>('GET', '/accounts');

    return response.accounts.map(account => ({
      currency: account.currency,
      available: account.available_balance.value,
      hold: account.hold.value,
      total: (parseFloat(account.available_balance.value) + parseFloat(account.hold.value)).toString(),
    }));
  }

  /**
   * Get current positions (non-zero balances)
   */
  async getPositions(): Promise<Position[]> {
    const accounts = await this.getAccounts();
    const positions: Position[] = [];

    for (const account of accounts) {
      const total = parseFloat(account.total);
      if (total === 0) continue;

      // Get current price for this currency
      const productId = `${account.currency}-USD`;
      try {
        const price = await this.getCurrentPrice(productId);

        // Calculate position details
        // Note: avgPrice would need to be calculated from trade history
        // For now, we'll use current price as a placeholder
        positions.push({
          symbol: account.currency,
          quantity: total,
          avgPrice: price, // TODO: Calculate from trade history
          currentPrice: price,
          unrealizedPnl: 0, // TODO: Calculate (currentPrice - avgPrice) * quantity
          unrealizedPnlPercentage: 0, // TODO: Calculate
        });
      } catch (error) {
        console.error(`Failed to get price for ${productId}:`, error);
        // Skip this position if we can't get the price
        continue;
      }
    }

    return positions;
  }

  /**
   * Get current price for a trading pair
   */
  async getCurrentPrice(productId: string): Promise<number> {
    interface ProductResponse {
      product_id: string;
      price: string;
      price_percentage_change_24h: string;
      volume_24h: string;
    }

    const response = await this.request<ProductResponse>('GET', `/products/${productId}`);
    return parseFloat(response.price);
  }

  /**
   * Get trade history (fills)
   */
  async getTradeHistory(productId?: string, limit: number = 100): Promise<Trade[]> {
    interface FillsResponse {
      fills: Array<{
        entry_id: string;
        trade_id: string;
        order_id: string;
        trade_time: string;
        trade_type: string;
        price: string;
        size: string;
        commission: string;
        product_id: string;
        side: 'BUY' | 'SELL';
      }>;
    }

    const params = new URLSearchParams({ limit: limit.toString() });
    if (productId) {
      params.append('product_id', productId);
    }

    const response = await this.request<FillsResponse>('GET', `/orders/historical/fills?${params}`);

    return response.fills.map(fill => ({
      id: fill.trade_id,
      product_id: fill.product_id,
      side: fill.side.toLowerCase() as 'buy' | 'sell',
      size: fill.size,
      price: fill.price,
      timestamp: fill.trade_time,
      fee: fill.commission,
    }));
  }

  /**
   * Calculate average buy price from trade history
   * Used to calculate unrealized P&L
   */
  async calculateAvgBuyPrice(symbol: string): Promise<number> {
    const productId = `${symbol}-USD`;
    const trades = await this.getTradeHistory(productId);

    let totalCost = 0;
    let totalQuantity = 0;

    for (const trade of trades) {
      if (trade.side === 'buy') {
        const quantity = parseFloat(trade.size);
        const price = parseFloat(trade.price);
        totalCost += quantity * price;
        totalQuantity += quantity;
      }
    }

    return totalQuantity > 0 ? totalCost / totalQuantity : 0;
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getAccounts();
      return true;
    } catch (error) {
      console.error('Coinbase API connection test failed:', error);
      return false;
    }
  }
}

/**
 * Factory function to create CoinbaseService from encrypted credentials
 */
export async function createCoinbaseService(
  apiKeyEncrypted: string,
  apiSecretEncrypted: string,
  decryptFn: (encrypted: string) => string
): Promise<CoinbaseService> {
  const apiKey = decryptFn(apiKeyEncrypted);
  const apiSecret = decryptFn(apiSecretEncrypted);

  return new CoinbaseService({ apiKey, apiSecret });
}
