# Favorites API Documentation

This API allows authenticated users to manage their favorite stocks and receive real-time data for those stocks only.

## Authentication

All endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Add Stock to Favorites
**POST** `/api/favorites/add`

**Request Body:**
```json
{
  "symbol": "RELIANCE.NS"
}
```

**Response:**
```json
{
  "message": "Stock added to favorites successfully",
  "favorites": ["RELIANCE.NS", "TCS.NS"]
}
```

### 2. Remove Stock from Favorites
**DELETE** `/api/favorites/remove/:symbol`

**Example:** `DELETE /api/favorites/remove/RELIANCE.NS`

**Response:**
```json
{
  "message": "Stock removed from favorites successfully",
  "favorites": ["TCS.NS"]
}
```

### 3. Get User's Favorites
**GET** `/api/favorites`

**Response:**
```json
{
  "favorites": ["RELIANCE.NS", "TCS.NS", "INFY.NS"]
}
```

## WebSocket Data

When a user connects via WebSocket with their JWT token, they will receive real-time data for their favorite stocks.

**Default Behavior**: If a user has no favorites selected, they will receive data for the default SEBI_TOP_10 stocks:
- RELIANCE.NS, TCS.NS, INFY.NS, HDFCBANK.NS, ICICIBANK.NS
- HINDUNILVR.NS, SBIN.NS, BHARTIARTL.NS, ITC.NS, LT.NS

**Socket Event:** `stockUpdate`

**Data Structure:**
```json
[
  {
    "symbol": "RELIANCE.NS",
    "name": "Reliance Industries Limited",
    "price": 2456.75,
    "last50Closes": [2400, 2410, 2420, ...],
    "sma": 2430.25,
    "isDefault": false
  }
]
```

**Note**: The `isDefault` field indicates whether the stock is from the user's favorites (`false`) or from the default list (`true`).

## Usage Examples

### Frontend JavaScript Examples

**Add to Favorites:**
```javascript
const response = await fetch('/api/favorites/add', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ symbol: 'RELIANCE.NS' })
});
const data = await response.json();
```

**Remove from Favorites:**
```javascript
const response = await fetch('/api/favorites/remove/RELIANCE.NS', {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const data = await response.json();
```

**Get Favorites:**
```javascript
const response = await fetch('/api/favorites', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const data = await response.json();
```

**WebSocket Connection:**
```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
});

socket.on('stockUpdate', (stockData) => {
  console.log('Received stock data:', stockData);
  
  // You can differentiate between user favorites and default stocks
  stockData.forEach(stock => {
    if (stock.isDefault) {
      console.log(`${stock.symbol} is from default list`);
    } else {
      console.log(`${stock.symbol} is from user favorites`);
    }
  });
  
  // Update your UI with the stock data
});
```

## Available Stock Symbols

You can use any valid Yahoo Finance symbol. For Indian stocks, use the `.NS` suffix:
- `RELIANCE.NS` - Reliance Industries
- `TCS.NS` - Tata Consultancy Services
- `INFY.NS` - Infosys
- `HDFCBANK.NS` - HDFC Bank
- `ICICIBANK.NS` - ICICI Bank
- And many more...

## Default Stocks (SEBI_TOP_10)

When users have no favorites, they automatically see data for these stocks:
1. **RELIANCE.NS** - Reliance Industries Limited
2. **TCS.NS** - Tata Consultancy Services Limited
3. **INFY.NS** - Infosys Limited
4. **HDFCBANK.NS** - HDFC Bank Limited
5. **ICICIBANK.NS** - ICICI Bank Limited
6. **HINDUNILVR.NS** - Hindustan Unilever Limited
7. **SBIN.NS** - State Bank of India
8. **BHARTIARTL.NS** - Bharti Airtel Limited
9. **ITC.NS** - ITC Limited
10. **LT.NS** - Larsen & Toubro Limited

## Error Responses

**401 Unauthorized:**
```json
{
  "error": "No token provided"
}
```

**400 Bad Request:**
```json
{
  "error": "Stock symbol is required"
}
```

**404 Not Found:**
```json
{
  "error": "User not found"
}
``` 