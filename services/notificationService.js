const nodemailer = require('nodemailer');

// Create reusable transporter object
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

class NotificationService {
  constructor() {
    this.connectedUsers = new Map(); // userId -> socket
  }

  // Register a user's socket connection
  registerUser(userId, socket) {
    this.connectedUsers.set(userId.toString(), socket);
    console.log(`📱 User ${userId} registered for notifications`);
  }

  // Unregister a user's socket connection
  unregisterUser(userId) {
    this.connectedUsers.delete(userId.toString());
    console.log(`📱 User ${userId} unregistered from notifications`);
  }

  // Send notification to a specific user
  sendNotification(userId, notification) {
    const socket = this.connectedUsers.get(userId.toString());
    
    if (socket) {
      socket.emit('notification', notification);
      console.log(`📢 Notification sent to user ${userId}:`, notification.title);
      return true;
    } else {
      console.log(`⚠️ User ${userId} is not online, notification queued`);
      return false;
    }
  }

  // Send stock alert notification
  sendStockAlert(userId, alert, currentPrice) {
    const notification = {
      type: 'stock_alert',
      title: `${alert.alertType.toUpperCase()} Alert: ${alert.symbol}`,
      message: alert.message || `${alert.symbol} has reached your target price of $${alert.targetPrice.toFixed(2)}`,
      data: {
        symbol: alert.symbol,
        alertType: alert.alertType,
        targetPrice: alert.targetPrice,
        currentPrice: currentPrice,
        alertId: alert._id
      },
      timestamp: new Date().toISOString()
    };

    return this.sendNotification(userId, notification);
  }

  // Send connection status notification
  sendConnectionAlert(userId, isConnected) {
    const notification = {
      type: 'connection_status',
      title: isConnected ? '🟢 Connected' : '🔴 Disconnected',
      message: isConnected ? 'Stock data connection restored' : 'Stock data connection lost',
      data: { isConnected },
      timestamp: new Date().toISOString()
    };

    return this.sendNotification(userId, notification);
  }

  // Send general notification
  sendGeneralNotification(userId, title, message, data = {}) {
    const notification = {
      type: 'general',
      title,
      message,
      data,
      timestamp: new Date().toISOString()
    };

    return this.sendNotification(userId, notification);
  }

  // Broadcast notification to all connected users
  broadcastNotification(notification) {
    let sentCount = 0;
    
    for (const [userId, socket] of this.connectedUsers) {
      try {
        socket.emit('notification', notification);
        sentCount++;
      } catch (error) {
        console.error(`Error sending broadcast to user ${userId}:`, error);
      }
    }

    console.log(`📢 Broadcast notification sent to ${sentCount} users`);
    return sentCount;
  }

  // Get connected users count
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  // Get list of connected user IDs
  getConnectedUserIds() {
    return Array.from(this.connectedUsers.keys());
  }

  // Check if user is online
  isUserOnline(userId) {
    return this.connectedUsers.has(userId.toString());
  }
}

// Create singleton instance
const notificationService = new NotificationService();

module.exports = notificationService;