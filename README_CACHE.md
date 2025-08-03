# Global Stock Price Cache System

## Overview

This system implements a global in-memory cache for stock prices with a 24-hour TTL (Time To Live). The cache serves stock data immediately to users without making external API calls, significantly improving response times and reducing load on external services.

## Features

- **24-hour Cache TTL**: Stock data is cached for 24 hours before requiring a refresh
- **Immediate Response**: Users get cached data instantly when connecting via WebSocket
- **Favorites Support**: Serves user's favorite stocks if available, otherwise shows default stocks
- **Automatic Updates**: Cache is updated every 5 minutes in the background
- **Health Monitoring**: Built-in cache health monitoring and statistics
- **Admin Controls**: Cache management endpoints for monitoring and maintenance

## Architecture

### Core Components

1. **Global Cache (`cache.js`)**
   - In-memory storage for stock data
   - TTL management
   - Cache validation and statistics

2. **Cache Manager (`services/cacheManager.js`)**
   - Background cache update service
   - Cache health monitoring
   - Manual cache operations

3. **Stock API (`utils/stockAPI.js`)**
   - Yahoo Finance integration
   - Cache-aware data fetching
   - Automatic cache population

4. **Socket Integration (`socket.js`)**
   - Immediate cached data delivery
   - Real-time updates to connected users
   - User-specific stock filtering

## Cache Behavior

### When User Connects
1. User connects via WebSocket
2. System checks for cached data for user's favorites (or defaults)
3. If cached data exists and is fresh (< 24 hours), sends immediately
4. If no cached data, fetches fresh data and caches it

### Background Updates
- Cache is updated every 5 minutes for default stocks
- All connected users receive updated data automatically
- Failed updates are logged but don't break the system

### Data Structure

```javascript
{
  symbol: "RELIANCE.NS",
  name: "Reliance Industries Limited",
  price: 2456.78,
  fiftyDayAverage: [2400, 2410, 2420, ...],
  lastUpdated: 1703123456789,
  isDefault: true
}
```

## API Endpoints

### Cache Statistics
```
GET /api/cache/stats
```
Returns cache statistics and health status (requires authentication)

### All Cached Stocks
```
GET /api/cache/stocks
```
Returns all stocks currently in cache (requires authentication)

### Update Specific Stock
```
POST /api/cache/update/:symbol
```
Manually update a specific stock in cache (requires authentication)

### Clear Cache
```
DELETE /api/cache/clear
```
Clear entire cache (requires admin role)

### Cache Health
```
GET /api/cache/health
```
Public endpoint for cache health status

## Default Stocks

The system maintains a list of default stocks that are always cached:

- RELIANCE.NS
- TCS.NS
- INFY.NS
- HDFCBANK.NS
- ICICIBANK.NS
- HINDUNILVR.NS
- SBIN.NS
- BHARTIARTL.NS
- ITC.NS
- LT.NS

## Configuration

### Cache TTL
Default: 24 hours (24 * 60 * 60 * 1000 milliseconds)
Can be modified in `cache.js`:

```javascript
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
```

### Update Interval
Default: 5 minutes (300000 milliseconds)
Can be modified in `socket.js`:

```javascript
cacheManager.startUpdateService(300000); // 5 minutes
```

## Monitoring

### Cache Health Status
- **healthy**: Cache is working normally
- **aging**: Cache data is getting old (> 1 hour)
- **stale**: Cache data is older than 24 hours
- **uninitialized**: Cache has not been initialized

### Statistics Available
- Total cached stocks
- Last update timestamp
- Cache age
- Initialization status

## Testing

Run the test script to verify cache functionality:

```bash
node test-cache.js
```

## Benefits

1. **Performance**: Immediate response times for users
2. **Reliability**: Reduced dependency on external APIs
3. **Cost Efficiency**: Fewer API calls to Yahoo Finance
4. **User Experience**: No loading delays for cached data
5. **Scalability**: Reduced server load during high traffic

## Error Handling

- Failed API calls don't break the cache system
- Stale data is served if fresh data is unavailable
- Comprehensive error logging for debugging
- Graceful degradation when external services are down

## Security

- Cache statistics require authentication
- Cache clearing requires admin role
- Public health endpoint for monitoring
- No sensitive data stored in cache 