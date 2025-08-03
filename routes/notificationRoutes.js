const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const notificationQueueService = require('../services/notificationQueueService');

// Apply authentication to all routes
router.use(authenticateToken);

// Get user's notifications
router.get('/', async (req, res) => {
  try {
    const notifications = await notificationQueueService.getUserNotifications(req.user.id);
    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications'
    });
  }
});

// Mark notification as read
router.put('/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;
    await notificationQueueService.markAsRead(notificationId, req.user.id);
    
    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read'
    });
  }
});

// Get notification queue status (admin only)
router.get('/status', (req, res) => {
  try {
    const status = notificationQueueService.getStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting notification queue status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get notification queue status'
    });
  }
});

module.exports = router; 