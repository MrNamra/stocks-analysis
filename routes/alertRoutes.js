const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const {
  getUserAlerts,
  getStockAlerts,
  createAlert,
  updateAlert,
  deleteAlert,
  checkAlerts,
  markNotificationSent
} = require('../controllers/alertController');
const alertService = require('../services/alertService');

// Apply authentication to all routes
router.use(authenticateToken);

// Get all alerts for the user
router.get('/', getUserAlerts);

// Get alerts for a specific stock
router.get('/stock/:symbol', getStockAlerts);

// Create a new alert
router.post('/', createAlert);

// Update an alert
router.put('/:alertId', updateAlert);

// Delete an alert
router.delete('/:alertId', deleteAlert);

// Mark alert notification as sent
router.put('/:alertId/notify', markNotificationSent);

// Get alert service status (admin only)
router.get('/status', (req, res) => {
  try {
    const status = alertService.getStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting alert service status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get alert service status'
    });
  }
});

module.exports = router; 