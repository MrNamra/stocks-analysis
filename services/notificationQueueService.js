const mongoose = require('mongoose');

// Notification Queue Schema for offline notifications
const notificationQueueSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['stock_alert', 'position_alert', 'system_alert'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    symbol: String,
    currentPrice: Number,
    targetPrice: Number,
    alertType: String,
    positionId: mongoose.Schema.Types.ObjectId
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isDelivered: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const NotificationQueue = mongoose.model('NotificationQueue', notificationQueueSchema);

class NotificationQueueService {
  constructor() {
    this.isRunning = false;
    this.processInterval = null;
    this.processIntervalMs = 30000; // Process every 30 seconds
  }

  // Start the notification queue processor
  start() {
    if (this.isRunning) {
      console.log('⚠️ Notification queue service is already running');
      return;
    }

    console.log('📬 Starting notification queue service...');
    this.isRunning = true;

    // Process immediately
    this.processQueue();

    // Set up periodic processing
    this.processInterval = setInterval(() => {
      this.processQueue();
    }, this.processIntervalMs);

    console.log(`✅ Notification queue service started (processing every ${this.processIntervalMs / 1000} seconds)`);
  }

  // Stop the notification queue processor
  stop() {
    if (!this.isRunning) {
      console.log('⚠️ Notification queue service is not running');
      return;
    }

    console.log('🛑 Stopping notification queue service...');
    this.isRunning = false;

    if (this.processInterval) {
      clearInterval(this.processInterval);
      this.processInterval = null;
    }

    console.log('✅ Notification queue service stopped');
  }

  // Add notification to queue
  async addToQueue(userId, type, title, message, data = {}) {
    try {
      const notification = new NotificationQueue({
        userId,
        type,
        title,
        message,
        data
      });

      await notification.save();
      console.log(`📝 Added notification to queue for user ${userId}: ${title}`);

      return notification;
    } catch (error) {
      console.error('❌ Error adding notification to queue:', error);
      throw error;
    }
  }

  // Process the notification queue
  async processQueue() {
    try {
      // Get undelivered notifications
      const undeliveredNotifications = await NotificationQueue.find({
        isDelivered: false
      }).populate('userId', 'email name');

      if (undeliveredNotifications.length === 0) {
        return;
      }

      console.log(`📬 Processing ${undeliveredNotifications.length} queued notifications...`);

      const notificationService = require('./notificationService');

      for (const notification of undeliveredNotifications) {
        try {
          // Try to send via WebSocket (if user is online)
          const sent = await notificationService.sendNotification(
            notification.userId._id,
            notification.title,
            notification.message,
            notification.data
          );

          if (sent) {
            // Mark as delivered if sent successfully
            notification.isDelivered = true;
            await notification.save();
            console.log(`✅ Delivered queued notification to ${notification.userId.email}`);
          } else {
            // Keep in queue for next attempt
            console.log(`⏳ User ${notification.userId.email} not online, keeping notification in queue`);
          }
        } catch (error) {
          console.error(`❌ Error processing notification for ${notification.userId.email}:`, error);
        }
      }

    } catch (error) {
      console.error('❌ Error processing notification queue:', error);
    }
  }

  // Get user's pending notifications
  async getUserNotifications(userId, limit = 50) {
    try {
      const notifications = await NotificationQueue.find({
        userId,
        isDelivered: true
      })
      .sort({ createdAt: -1 })
      .limit(limit);

      return notifications;
    } catch (error) {
      console.error('❌ Error getting user notifications:', error);
      return [];
    }
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    try {
      await NotificationQueue.findOneAndUpdate(
        { _id: notificationId, userId },
        { isRead: true }
      );
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
    }
  }

  // Clear old notifications (older than 30 days)
  async clearOldNotifications() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await NotificationQueue.deleteMany({
        createdAt: { $lt: thirtyDaysAgo }
      });

      if (result.deletedCount > 0) {
        console.log(`🗑️ Cleared ${result.deletedCount} old notifications`);
      }
    } catch (error) {
      console.error('❌ Error clearing old notifications:', error);
    }
  }

  // Get service status
  getStatus() {
    return {
      isRunning: this.isRunning,
      processIntervalMs: this.processIntervalMs
    };
  }
}

// Export singleton instance
module.exports = new NotificationQueueService(); 