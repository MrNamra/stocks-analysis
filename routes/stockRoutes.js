const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/:symbol', authenticateToken, stockController.getStockData);

module.exports = router;