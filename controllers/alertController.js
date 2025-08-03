const StockAlert = require('../models/StockAlert');
const alertService = require('../services/alertService');

// Get all alerts for a user
const getUserAlerts = async (req, res) => {
  try {
    const alerts = await StockAlert.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    console.error('Error fetching user alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch alerts'
    });
  }
};

// Get alerts for a specific stock
const getStockAlerts = async (req, res) => {
  try {
    const { symbol } = req.params;
    const alerts = await StockAlert.find({
      userId: req.user.id,
      symbol: symbol.toUpperCase()
    }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    console.error('Error fetching stock alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch alerts'
    });
  }
};

// Create a new alert
const createAlert = async (req, res) => {
  try {
    const { 
      symbol, 
      alertType, 
      targetPrice, 
      percentageChange, 
      condition, 
      positionId,
      basePrice 
    } = req.body;
    
    if (!symbol || !alertType || !targetPrice || !condition) {
      return res.status(400).json({
        success: false,
        error: 'Symbol, alert type, target price, and condition are required'
      });
    }

    if (!['buy', 'sell', 'stop_loss', 'take_profit'].includes(alertType)) {
      return res.status(400).json({
        success: false,
        error: 'Alert type must be "buy", "sell", "stop_loss", or "take_profit"'
      });
    }

    if (!['price_target', 'percentage_gain', 'percentage_loss'].includes(condition)) {
      return res.status(400).json({
        success: false,
        error: 'Condition must be "price_target", "percentage_gain", or "percentage_loss"'
      });
    }

    // For position-based alerts, check if position exists
    if (['sell', 'stop_loss', 'take_profit'].includes(alertType) && positionId) {
      const StockPosition = require('../models/StockPosition');
      const position = await StockPosition.findOne({ 
        _id: positionId, 
        userId: req.user.id 
      });
      
      if (!position) {
        return res.status(400).json({
          success: false,
          error: 'Position not found for this alert'
        });
      }
    }

    // Generate appropriate message based on alert type and condition
    let message = '';
    switch (alertType) {
      case 'buy':
        message = condition === 'price_target' 
          ? `Buy alert: ${symbol} has reached ₹${targetPrice}`
          : `Buy alert: ${symbol} has ${percentageChange}% change`;
        break;
      case 'sell':
        message = condition === 'price_target'
          ? `Sell alert: ${symbol} has reached ₹${targetPrice}`
          : `Sell alert: ${symbol} has ${percentageChange}% gain`;
        break;
      case 'stop_loss':
        message = condition === 'price_target'
          ? `Stop loss alert: ${symbol} has dropped to ₹${targetPrice}`
          : `Stop loss alert: ${symbol} has ${percentageChange}% loss`;
        break;
      case 'take_profit':
        message = condition === 'price_target'
          ? `Take profit alert: ${symbol} has reached ₹${targetPrice}`
          : `Take profit alert: ${symbol} has ${percentageChange}% gain`;
        break;
    }

    const alert = new StockAlert({
      userId: req.user.id,
      symbol: symbol.toUpperCase(),
      alertType,
      targetPrice,
      percentageChange,
      condition,
      positionId,
      basePrice,
      message
    });

    await alert.save();

    res.json({
      success: true,
      data: alert,
      message: 'Alert created successfully'
    });
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create alert'
    });
  }
};

// Update an alert
const updateAlert = async (req, res) => {
  try {
    const { alertId } = req.params;
    const { targetPrice, percentageChange, isActive } = req.body;
    
    const alert = await StockAlert.findOneAndUpdate(
      { _id: alertId, userId: req.user.id },
      {
        targetPrice,
        percentageChange,
        isActive,
        message: alert.alertType === 'buy' 
          ? `Buy alert: ${alert.symbol} has reached ₹${targetPrice}`
          : `Sell alert: ${alert.symbol} has reached ₹${targetPrice}`
      },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }

    res.json({
      success: true,
      data: alert,
      message: 'Alert updated successfully'
    });
  } catch (error) {
    console.error('Error updating alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update alert'
    });
  }
};

// Delete an alert
const deleteAlert = async (req, res) => {
  try {
    const { alertId } = req.params;
    
    const alert = await StockAlert.findOneAndDelete({
      _id: alertId,
      userId: req.user.id
    });

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }

    res.json({
      success: true,
      message: 'Alert deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete alert'
    });
  }
};

// Mark alert as notification sent
const markNotificationSent = async (req, res) => {
  try {
    const { alertId } = req.params;
    
    const alert = await StockAlert.findOneAndUpdate(
      { _id: alertId, userId: req.user.id },
      { notificationSent: true },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }

    res.json({
      success: true,
      data: alert,
      message: 'Notification marked as sent'
    });
  } catch (error) {
    console.error('Error marking notification sent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification'
    });
  }
};

module.exports = {
  getUserAlerts,
  getStockAlerts,
  createAlert,
  updateAlert,
  deleteAlert,
  markNotificationSent
}; 