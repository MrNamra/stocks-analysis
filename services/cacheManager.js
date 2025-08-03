const { 
  getCachedStocksForUser, 
  getAllCachedStocks, 
  getCacheStats, 
  clearCache,
  setCachedStock,
  DEFAULT_STOCKS 
} = require('../cache');
const { fetchCurrentPrice } = require('../utils/stockAPI');

class CacheManager {
  constructor() {
    this.updateInterval = null;
    this.isRunning = false;
  }

  // Start the cache update service
  startUpdateService(intervalMs = 300000) { // Default 5 minutes
    if (this.isRunning) {
      console.log('⚠️ Cache update service is already running');
      return;
    }

    this.isRunning = true;
    this.updateInterval = setInterval(async () => {
      await this.updateCache();
    }, intervalMs);

    console.log(`🔄 Cache update service started (interval: ${intervalMs / 1000}s)`);
  }

  // Stop the cache update service
  stopUpdateService() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      this.isRunning = false;
      console.log('⏹️ Cache update service stopped');
    }
  }

  // Update cache with fresh data
  async updateCache(symbols = null) {
    try {
      const stocksToUpdate = symbols || DEFAULT_STOCKS;
      console.log(`🔄 Updating cache for ${stocksToUpdate.length} stocks...`);

      const promises = stocksToUpdate.map(async (symbol) => {
        try {
          const data = await fetchCurrentPrice(symbol);
          return { symbol, success: true, data };
        } catch (error) {
          console.error(`❌ Failed to update ${symbol}:`, error.message);
          return { symbol, success: false, error: error.message };
        }
      });

      const results = await Promise.all(promises);
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      console.log(`✅ Cache update completed: ${successCount} success, ${failureCount} failed`);
      
      // If we have very few stocks cached, try to populate with more
      if (successCount < 5) {
        console.log(`⚠️ Only ${successCount} stocks cached successfully, attempting to populate more...`);
        await this.ensureMinimumCache();
      }
      
      return results;
    } catch (error) {
      console.error('❌ Error updating cache:', error);
      throw error;
    }
  }

  // Ensure minimum cache population
  async ensureMinimumCache() {
    try {
      // const allCached = getAllCachedStocks();
      // if (allCached.length < 5) {
      //   console.log(`🔄 Ensuring minimum cache population (currently ${allCached.length} stocks)...`);
        
      //   // Try to fetch additional stocks if we don't have enough
      //   const additionalStocks = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA'];
      //   for (const symbol of additionalStocks) {
      //     if (allCached.length >= 10) break; // Stop if we have enough
          
      //     try {
      //       const data = await fetchCurrentPrice(symbol);
      //       if (data && data.price) {
      //         console.log(`✅ Added ${symbol} to cache`);
      //       }
      //     } catch (error) {
      //       console.log(`❌ Failed to add ${symbol} to cache`);
      //     }
      //   }
      // }
    } catch (error) {
      console.error('❌ Error ensuring minimum cache:', error);
    }
  }

  // Get cache statistics
  getStats() {
    return getCacheStats();
  }

  // Get all cached stocks
  getAllStocks() {
    return getAllCachedStocks();
  }

  // Get cached stocks for a specific user
  getUserStocks(userFavorites = []) {
    return getCachedStocksForUser(userFavorites);
  }

  // Manually add/update a stock in cache
  async updateStock(symbol) {
    try {
      const data = await fetchCurrentPrice(symbol);
      setCachedStock(symbol, data);
      console.log(`✅ Manually updated ${symbol} in cache`);
      return { success: true, data };
    } catch (error) {
      console.error(`❌ Failed to manually update ${symbol}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Clear entire cache
  clear() {
    clearCache();
    console.log('🗑️ Cache cleared');
  }

  // Get cache health status
  getHealthStatus() {
    const stats = getCacheStats();
    const now = Date.now();
    const cacheAge = stats.cacheAge;
    
    let status = 'healthy';
    let message = 'Cache is working normally';

    if (!stats.isInitialized) {
      status = 'uninitialized';
      message = 'Cache has not been initialized';
    } else if (cacheAge > 24 * 60 * 60 * 1000) { // 24 hours
      status = 'stale';
      message = 'Cache data is older than 24 hours';
    } else if (cacheAge > 60 * 60 * 1000) { // 1 hour
      status = 'aging';
      message = 'Cache data is getting old, consider updating';
    }

    return {
      status,
      message,
      stats,
      timestamp: now
    };
  }
}

// Create singleton instance
const cacheManager = new CacheManager();

module.exports = cacheManager; 