# FansTrade API Documentation

Base URL: `http://localhost:3000`

## Table of Contents

1. [Authentication](#authentication)
2. [Exchange Integration](#exchange-integration)
3. [Social - Follow System](#social---follow-system)
4. [Error Handling](#error-handling)

---

## Authentication

### 1. Register User

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "email": "trader@example.com",
  "username": "cryptotrader",
  "password": "secure_password_123",
  "displayName": "Crypto Trader" // optional
}
```

**Response (201 Created):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "trader@example.com",
    "username": "cryptotrader",
    "displayName": "Crypto Trader",
    "avatarUrl": null,
    "bio": null,
    "isVerified": false,
    "createdAt": "2025-01-12T10:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "trader@example.com",
    "username": "cryptotrader",
    "password": "secure_password_123"
  }'
```

---

### 2. Login User

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "trader@example.com",
  "password": "secure_password_123"
}
```

**Response (200 OK):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "trader@example.com",
    "username": "cryptotrader",
    "displayName": "Crypto Trader",
    "isVerified": false
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "trader@example.com",
    "password": "secure_password_123"
  }'
```

---

### 3. Get Current User

**Endpoint:** `GET /api/auth/me`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "trader@example.com",
    "username": "cryptotrader",
    "displayName": "Crypto Trader",
    "avatarUrl": null,
    "bio": null,
    "twitterHandle": null,
    "isVerified": false,
    "createdAt": "2025-01-12T10:00:00.000Z"
  }
}
```

**cURL Example:**
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 4. Update Profile

**Endpoint:** `PATCH /api/auth/profile`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Request Body:**
```json
{
  "displayName": "Pro Crypto Trader",
  "bio": "10 years of crypto trading experience. Follow for alpha signals!",
  "twitterHandle": "cryptotrader",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

**Response (200 OK):**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "trader@example.com",
    "username": "cryptotrader",
    "displayName": "Pro Crypto Trader",
    "bio": "10 years of crypto trading experience. Follow for alpha signals!",
    "avatarUrl": "https://example.com/avatar.jpg",
    "twitterHandle": "cryptotrader",
    "isVerified": false
  }
}
```

---

## Exchange Integration

### 1. Connect Exchange API

**Endpoint:** `POST /api/exchange/connect`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Request Body:**
```json
{
  "exchange": "coinbase",
  "apiKey": "your-coinbase-api-key",
  "apiSecret": "your-coinbase-api-secret"
}
```

**Supported Exchanges:**
- `coinbase` - Coinbase Advanced Trade API
- `binance` - Binance API (Coming soon)
- `alpaca` - Alpaca Trading API (Coming soon)

**Response (200 OK):**
```json
{
  "message": "Exchange API connected successfully",
  "exchange": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "exchange": "coinbase",
    "status": "active",
    "permissions": ["read"],
    "lastSyncAt": "2025-01-12T10:30:00.000Z"
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/exchange/connect \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "exchange": "coinbase",
    "apiKey": "your-api-key",
    "apiSecret": "your-api-secret"
  }'
```

**Security Note:** API credentials are encrypted using AES-256-GCM before storage.

---

### 2. List Connected Exchanges

**Endpoint:** `GET /api/exchange/list`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response (200 OK):**
```json
{
  "exchanges": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "exchange": "coinbase",
      "permissions": ["read"],
      "status": "active",
      "lastSyncAt": "2025-01-12T10:30:00.000Z",
      "createdAt": "2025-01-12T10:00:00.000Z"
    }
  ]
}
```

---

### 3. Get Current Positions

**Endpoint:** `GET /api/exchange/positions`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Query Parameters:**
- `exchange` (optional): Exchange name (default: `coinbase`)

**Response (200 OK):**
```json
{
  "exchange": "coinbase",
  "positions": [
    {
      "symbol": "BTC",
      "quantity": 0.5,
      "avgPrice": 45000,
      "currentPrice": 48000,
      "unrealizedPnl": 1500,
      "unrealizedPnlPercentage": 6.67
    },
    {
      "symbol": "ETH",
      "quantity": 10,
      "avgPrice": 2500,
      "currentPrice": 2700,
      "unrealizedPnl": 2000,
      "unrealizedPnlPercentage": 8.0
    }
  ],
  "summary": {
    "totalValue": 49500,
    "totalPnl": 3500,
    "totalPnlPercentage": 7.6,
    "positionCount": 2
  },
  "timestamp": "2025-01-12T10:45:00.000Z"
}
```

**cURL Example:**
```bash
curl -X GET "http://localhost:3000/api/exchange/positions?exchange=coinbase" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 4. Get Trade History

**Endpoint:** `GET /api/exchange/history`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Query Parameters:**
- `exchange` (optional): Exchange name (default: `coinbase`)
- `limit` (optional): Number of trades to return (default: `100`)

**Response (200 OK):**
```json
{
  "exchange": "coinbase",
  "trades": [
    {
      "id": "12345",
      "product_id": "BTC-USD",
      "side": "buy",
      "size": "0.5",
      "price": "45000",
      "timestamp": "2025-01-12T09:00:00.000Z",
      "fee": "22.5"
    },
    {
      "id": "12346",
      "product_id": "ETH-USD",
      "side": "buy",
      "size": "10",
      "price": "2500",
      "timestamp": "2025-01-12T08:00:00.000Z",
      "fee": "12.5"
    }
  ],
  "count": 2
}
```

**cURL Example:**
```bash
curl -X GET "http://localhost:3000/api/exchange/history?exchange=coinbase&limit=50" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 5. Disconnect Exchange

**Endpoint:** `DELETE /api/exchange/:id`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response (200 OK):**
```json
{
  "message": "Exchange API disconnected successfully"
}
```

**cURL Example:**
```bash
curl -X DELETE http://localhost:3000/api/exchange/660e8400-e29b-41d4-a716-446655440001 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Social - Follow System

### 1. Follow a User

**Endpoint:** `POST /api/follow/:userId`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Request Body:**
```json
{
  "config": {
    "autoNotify": true,
    "symbolsFilter": ["BTC", "ETH"],
    "maxAmountPerTrade": 1000
  }
}
```

**Response (201 Created):**
```json
{
  "message": "Successfully followed user",
  "follow": {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "traderId": "880e8400-e29b-41d4-a716-446655440001",
    "createdAt": "2025-01-12T11:00:00.000Z",
    "config": {
      "autoNotify": true,
      "symbolsFilter": ["BTC", "ETH"],
      "maxAmountPerTrade": 1000
    }
  },
  "trader": {
    "id": "880e8400-e29b-41d4-a716-446655440001",
    "username": "cryptowhale",
    "displayName": "Crypto Whale",
    "avatarUrl": "https://example.com/whale.jpg",
    "isVerified": true
  }
}
```

**Error Responses:**
- **400 Bad Request** - Cannot follow yourself
  ```json
  {
    "error": "Cannot follow yourself"
  }
  ```
- **400 Bad Request** - Already following this user
  ```json
  {
    "error": "Already following this user"
  }
  ```
- **404 Not Found** - User not found
  ```json
  {
    "error": "User not found"
  }
  ```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/follow/880e8400-e29b-41d4-a716-446655440001 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "autoNotify": true,
      "symbolsFilter": ["BTC", "ETH"],
      "maxAmountPerTrade": 1000
    }
  }'
```

---

### 2. Unfollow a User

**Endpoint:** `DELETE /api/follow/:userId`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response (200 OK):**
```json
{
  "message": "Successfully unfollowed user"
}
```

**cURL Example:**
```bash
curl -X DELETE http://localhost:3000/api/follow/880e8400-e29b-41d4-a716-446655440001 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 3. Get Following List

**Endpoint:** `GET /api/follow/following`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Query Parameters:**
- `limit` (optional): Number of results to return (default: `20`)
- `offset` (optional): Pagination offset (default: `0`)

**Response (200 OK):**
```json
{
  "following": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "createdAt": "2025-01-10T15:30:00.000Z",
      "config": {
        "autoNotify": true,
        "symbolsFilter": ["BTC", "ETH"],
        "maxAmountPerTrade": 1000
      },
      "trader": {
        "id": "880e8400-e29b-41d4-a716-446655440001",
        "username": "cryptowhale",
        "displayName": "Crypto Whale",
        "avatarUrl": "https://example.com/whale.jpg",
        "isVerified": true,
        "_count": {
          "followers": 1234
        }
      }
    }
  ],
  "total": 15,
  "limit": 20,
  "offset": 0
}
```

**cURL Example:**
```bash
curl -X GET "http://localhost:3000/api/follow/following?limit=20&offset=0" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 4. Get Followers List

**Endpoint:** `GET /api/follow/followers`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Query Parameters:**
- `limit` (optional): Number of results to return (default: `20`)
- `offset` (optional): Pagination offset (default: `0`)

**Response (200 OK):**
```json
{
  "followers": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "createdAt": "2025-01-12T09:15:00.000Z",
      "follower": {
        "id": "990e8400-e29b-41d4-a716-446655440003",
        "username": "trader123",
        "displayName": "Trader",
        "avatarUrl": "https://example.com/trader.jpg",
        "isVerified": false
      }
    }
  ],
  "total": 42,
  "limit": 20,
  "offset": 0
}
```

**cURL Example:**
```bash
curl -X GET "http://localhost:3000/api/follow/followers?limit=20&offset=0" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 5. Check Follow Status

**Endpoint:** `GET /api/follow/check/:userId`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response (200 OK):**
```json
{
  "isFollowing": true
}
```

**cURL Example:**
```bash
curl -X GET http://localhost:3000/api/follow/check/880e8400-e29b-41d4-a716-446655440001 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 6. Get Follow Statistics

**Endpoint:** `GET /api/follow/stats/:userId`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response (200 OK):**
```json
{
  "userId": "880e8400-e29b-41d4-a716-446655440001",
  "followersCount": 1234,
  "followingCount": 56
}
```

**cURL Example:**
```bash
curl -X GET http://localhost:3000/api/follow/stats/880e8400-e29b-41d4-a716-446655440001 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Error Handling

### Error Response Format

All errors follow this structure:

```json
{
  "error": "Error message here"
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (invalid token or credentials) |
| 404 | Not Found |
| 500 | Internal Server Error |

### Common Error Examples

**400 Validation Error:**
```json
{
  "error": "Validation error",
  "details": [
    {
      "code": "invalid_type",
      "expected": "string",
      "received": "undefined",
      "path": ["email"],
      "message": "Required"
    }
  ]
}
```

**401 Authentication Error:**
```json
{
  "error": "Invalid or expired token"
}
```

**404 Not Found:**
```json
{
  "error": "Exchange API not found"
}
```

---

## Complete Usage Example

### 1. Register & Login

```bash
# Register
RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "trader@example.com",
    "username": "cryptotrader",
    "password": "secure_password_123"
  }')

# Extract token
TOKEN=$(echo $RESPONSE | jq -r '.token')
echo "Token: $TOKEN"
```

### 2. Connect Coinbase API

```bash
curl -X POST http://localhost:3000/api/exchange/connect \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "exchange": "coinbase",
    "apiKey": "YOUR_COINBASE_API_KEY",
    "apiSecret": "YOUR_COINBASE_API_SECRET"
  }'
```

### 3. Get Positions

```bash
curl -X GET http://localhost:3000/api/exchange/positions \
  -H "Authorization: Bearer $TOKEN"
```

---

## WebSocket Events (Coming Soon)

The API also supports real-time updates via WebSocket:

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
});

// Subscribe to a trader's signals
socket.emit('subscribe', traderId);

// Listen for trade signals
socket.on('trade_signal', (signal) => {
  console.log('New signal:', signal);
});
```

---

## Rate Limiting

Currently no rate limiting is enforced. Production deployment will include:
- 100 requests/minute per IP
- 1000 requests/hour per user

---

## Support

For issues or questions:
- GitHub Issues: https://github.com/yourusername/fanstrade/issues
- Email: support@fanstrade.com
