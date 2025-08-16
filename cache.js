// Global stock price cache with 24-hour TTL
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
// const DEFAULT_STOCKS = ['RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'ICICIBANK.NS', 'HINDUNILVR.NS', 'SBIN.NS', 'BHARTIARTL.NS', 'ITC.NS', 'LT.NS'];
const DEFAULT_STOCKS = ['RELIANCE.NS', 'TCS.NS'];

// Global cache object
const globalStockCache = {
  data: {},
  timestamps: {},
  lastUpdate: null,
  isInitialized: false
};

// Cache management functions
function getCachedStock(symbol) {
  const now = Date.now();
  const cached = globalStockCache.data[symbol];
  const timestamp = globalStockCache.timestamps[symbol];
  
  if (cached && timestamp && (now - timestamp < CACHE_TTL)) {
    return cached;
  }
  return null;
}

function setCachedStock(symbol, data) {
  globalStockCache.data[symbol] = data;
  globalStockCache.timestamps[symbol] = Date.now();
  globalStockCache.lastUpdate = Date.now();
  globalStockCache.isInitialized = true;
}

function isCacheValid() {
  return globalStockCache.isInitialized && globalStockCache.lastUpdate;
}

function getCacheAge() {
  if (!globalStockCache.lastUpdate) return null;
  return Date.now() - globalStockCache.lastUpdate;
}

function getCachedStocksForUser(userFavorites = []) {
  const stocksToReturn = userFavorites.length > 0 ? userFavorites : DEFAULT_STOCKS;
  const result = [];
  
  for (const symbol of stocksToReturn) {
    const cached = getCachedStock(symbol);
    if (cached) {
      result.push({
        ...cached,
        symbol,
        isDefault: !userFavorites.includes(symbol)
      });
    }
  }
  
  // If user has no favorites and we don't have enough cached stocks, 
  // return whatever we have cached plus some defaults
  if (userFavorites.length === 0 && result.length < 5) {
    // console.log(`⚠️ Only ${result.length} stocks cached, fetching more defaults...`);
    // Return all cached stocks regardless of whether they're in DEFAULT_STOCKS
    const allCached = getAllCachedStocks();
    return allCached.slice(0, 10); // Return up to 10 stocks
  }
  
  return result;
}

function getAllCachedStocks() {
  return Object.keys(globalStockCache.data).map(symbol => ({
    symbol,
    ...globalStockCache.data[symbol]
  }));
}

function clearCache() {
  globalStockCache.data = {};
  globalStockCache.timestamps = {};
  globalStockCache.lastUpdate = null;
  globalStockCache.isInitialized = false;
}

function initializeCache() {
  globalStockCache.isInitialized = true;
  globalStockCache.lastUpdate = Date.now();
}

function getCacheStats() {
  return {
    totalStocks: Object.keys(globalStockCache.data).length,
    lastUpdate: globalStockCache.lastUpdate,
    cacheAge: getCacheAge(),
    isInitialized: globalStockCache.isInitialized,
    defaultStocks: DEFAULT_STOCKS
  };
}

module.exports = {
  globalStockCache,
  getCachedStock,
  setCachedStock,
  isCacheValid,
  getCacheAge,
  getCachedStocksForUser,
  getAllCachedStocks,
  clearCache,
  initializeCache,
  getCacheStats,
  DEFAULT_STOCKS,
  CACHE_TTL
};