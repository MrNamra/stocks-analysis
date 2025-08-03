const mongoose = require('mongoose');

const stockAlertSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  symbol: {
    type: String,
    required: true,
    uppercase: true
  },
  alertType: {
    type: String,
    enum: ['buy', 'sell', 'stop_loss', 'take_profit'],
    required: true
  },
  targetPrice: {
    type: Number,
    required: true,
    min: 0
  },
  percentageChange: {
    type: Number,
    min: 0,
    max: 100
  },
  // For position-based alerts (sell, stop_loss, take_profit)
  positionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StockPosition'
  },
  // Alert conditions
  condition: {
    type: String,
    enum: ['price_target', 'percentage_gain', 'percentage_loss'],
    required: true
  },
  // For percentage-based alerts
  basePrice: {
    type: Number,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isTriggered: {
    type: Boolean,
    default: false
  },
  triggeredAt: {
    type: Date
  },
  notificationSent: {
    type: Boolean,
    default: false
  },
  message: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient querying of active alerts
stockAlertSchema.index({ userId: 1, symbol: 1, isActive: 1 });

module.exports = mongoose.model('StockAlert', stockAlertSchema); 