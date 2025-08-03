const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const {
  getUserPositions,
  getStockPosition,
  createOrUpdatePosition,
  deletePosition,
  getPositionSummary
} = require('../controllers/positionController');

// Apply authentication to all routes
router.use(authenticateToken);

// Get all positions for the user
router.get('/', getUserPositions);

// Get position summary with current market values
router.post('/summary', getPositionSummary);

// Get position for a specific stock
router.get('/:symbol', getStockPosition);

// Create or update a position
router.post('/', createOrUpdatePosition);

// Delete a position
router.delete('/:symbol', deletePosition);

module.exports = router; 