const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const {
  searchStocks,
  getStockDetails,
  validateSymbol
} = require('../controllers/searchController');

// Apply authentication to all routes
router.use(authenticateToken);

// Search stocks
router.get('/search', searchStocks);

// Get stock details by symbol
router.get('/details/:symbol', getStockDetails);

// Validate stock symbol
router.get('/validate/:symbol', validateSymbol);

module.exports = router; 