const express = require('express');
const router = express.Router();
const cacheManager = require('../services/cacheManager');
const { authenticateToken } = require('../middleware/authMiddleware');

// Get cache statistics (protected route)
router.get('/stats', authenticateToken, (req, res) => {
  try {
    const stats = cacheManager.getStats();
    const health = cacheManager.getHealthStatus();
    
    res.json({
      success: true,
      data: {
        stats,
        health,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('Error getting cache stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get cache statistics'
    });
  }
});

// Get all cached stocks (protected route)
router.get('/stocks', authenticateToken, (req, res) => {
  try {
    const stocks = cacheManager.getAllStocks();
    
    res.json({
      success: true,
      data: {
        stocks,
        count: stocks.length,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('Error getting cached stocks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get cached stocks'
    });
  }
});

// Manually update a specific stock (protected route)
router.post('/update/:symbol', authenticateToken, async (req, res) => {
  try {
    const { symbol } = req.params;
    const result = await cacheManager.updateStock(symbol);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        message: `Successfully updated ${symbol}`
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update stock'
    });
  }
});

// Clear entire cache (admin only - protected route)
router.delete('/clear', authenticateToken, (req, res) => {
  try {
    // Check if user is admin (you can implement your own admin check)
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    cacheManager.clear();
    
    res.json({
      success: true,
      message: 'Cache cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache'
    });
  }
});

// Get cache health status (protected route)
router.get('/health', authenticateToken, (req, res) => {
  try {
    const health = cacheManager.getHealthStatus();
    
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error('Error getting cache health:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get cache health'
    });
  }
});

// Debug endpoint to see cached data structure (protected route)
router.get('/debug', authenticateToken, (req, res) => {
  try {
    const allStocks = cacheManager.getAllStocks();
    res.json({
      success: true,
      data: {
        totalStocks: allStocks.length,
        stocks: allStocks.map(stock => ({
          symbol: stock.symbol,
          price: stock.price,
          name: stock.name,
          hasHistoricalData: stock.fiftyDayAverage && stock.fiftyDayAverage.length > 0,
          historicalDataLength: stock.fiftyDayAverage ? stock.fiftyDayAverage.length : 0,
          lastUpdated: stock.lastUpdated
        }))
      }
    });
  } catch (error) {
    console.error('Error getting debug data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get debug data'
    });
  }
});

module.exports = router; 