const StockAlert = require('../models/StockAlert');
const { fetchCurrentPrice } = require('../utils/stockAPI');
const notificationService = require('./notificationService');
const notificationQueueService = require('./notificationQueueService');

class AlertService {
  constructor() {
    this.isRunning = false;
    this.checkInterval = null;
    this.checkIntervalMs = 60000; // Check every 1 minute
  }

  // Start the automatic alert checking service
  start() {
    if (this.isRunning) {
      console.log('⚠️ Alert service is already running');
      return;
    }

    console.log('🚨 Starting automatic alert checking service...');
    this.isRunning = true;

    // Check immediately
    this.checkAllAlerts();

    // Set up periodic checking
    this.checkInterval = setInterval(() => {
      this.checkAllAlerts();
    }, this.checkIntervalMs);

    console.log(`✅ Alert service started (checking every ${this.checkIntervalMs / 1000} seconds)`);
  }

  // Stop the automatic alert checking service
  stop() {
    if (!this.isRunning) {
      console.log('⚠️ Alert service is not running');
      return;
    }

    console.log('🛑 Stopping automatic alert checking service...');
    this.isRunning = false;

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    console.log('✅ Alert service stopped');
  }

  // Check all active alerts for all users
  async checkAllAlerts() {
    try {
      console.log('🔍 Checking all active alerts...');

      // Get all active alerts
      const activeAlerts = await StockAlert.find({
        isActive: true,
        isTriggered: false
      }).populate('userId', 'email name');

      if (activeAlerts.length === 0) {
        console.log('📊 No active alerts to check');
        return;
      }

      console.log(`📊 Checking ${activeAlerts.length} active alerts...`);

      // Group alerts by symbol to minimize API calls
      const alertsBySymbol = {};
      activeAlerts.forEach(alert => {
        if (!alertsBySymbol[alert.symbol]) {
          alertsBySymbol[alert.symbol] = [];
        }
        alertsBySymbol[alert.symbol].push(alert);
      });

      const triggeredAlerts = [];

      // Check each symbol
      for (const [symbol, alerts] of Object.entries(alertsBySymbol)) {
        try {
          // Get current price for this symbol
          const stockData = await fetchCurrentPrice(symbol);
          
          if (!stockData || !stockData.price) {
            console.log(`⚠️ Could not get price for ${symbol}, skipping alerts`);
            continue;
          }

          const currentPrice = stockData.price;

          // Check each alert for this symbol
          for (const alert of alerts) {
            let shouldTrigger = false;
            let message = '';

            // Get position data for position-based alerts
            let position = null;
            if (alert.positionId) {
              const StockPosition = require('../models/StockPosition');
              position = await StockPosition.findById(alert.positionId);
            }

            switch (alert.alertType) {
              case 'buy':
                // Buy alert: trigger when price goes down to or below target
                if (alert.condition === 'price_target') {
                  shouldTrigger = currentPrice <= alert.targetPrice;
                } else if (alert.condition === 'percentage_gain' && alert.basePrice) {
                  const percentageChange = ((currentPrice - alert.basePrice) / alert.basePrice) * 100;
                  shouldTrigger = percentageChange >= alert.percentageChange;
                }
                break;

              case 'sell':
                // Sell alert: only if user has position
                if (position) {
                  if (alert.condition === 'price_target') {
                    shouldTrigger = currentPrice >= alert.targetPrice;
                  } else if (alert.condition === 'percentage_gain') {
                    const percentageGain = ((currentPrice - position.purchasePrice) / position.purchasePrice) * 100;
                    shouldTrigger = percentageGain >= alert.percentageChange;
                  }
                }
                break;

              case 'stop_loss':
                // Stop loss alert: only if user has position
                if (position) {
                  if (alert.condition === 'price_target') {
                    shouldTrigger = currentPrice <= alert.targetPrice;
                  } else if (alert.condition === 'percentage_loss') {
                    const percentageLoss = ((position.purchasePrice - currentPrice) / position.purchasePrice) * 100;
                    shouldTrigger = percentageLoss >= alert.percentageChange;
                  }
                }
                break;

              case 'take_profit':
                // Take profit alert: only if user has position
                if (position) {
                  if (alert.condition === 'price_target') {
                    shouldTrigger = currentPrice >= alert.targetPrice;
                  } else if (alert.condition === 'percentage_gain') {
                    const percentageGain = ((currentPrice - position.purchasePrice) / position.purchasePrice) * 100;
                    shouldTrigger = percentageGain >= alert.percentageChange;
                  }
                }
                break;
            }

            if (shouldTrigger) {
              // Generate appropriate message based on alert type
              switch (alert.alertType) {
                case 'buy':
                  message = `🟢 BUY ALERT: ${symbol} is now at ₹${currentPrice.toFixed(2)} (target: ₹${alert.targetPrice.toFixed(2)})`;
                  break;
                case 'sell':
                  message = `🔴 SELL ALERT: ${symbol} is now at ₹${currentPrice.toFixed(2)} (target: ₹${alert.targetPrice.toFixed(2)})`;
                  break;
                case 'stop_loss':
                  message = `⚠️ STOP LOSS: ${symbol} has dropped to ₹${currentPrice.toFixed(2)} (stop loss: ₹${alert.targetPrice.toFixed(2)})`;
                  break;
                case 'take_profit':
                  message = `💰 TAKE PROFIT: ${symbol} has reached ₹${currentPrice.toFixed(2)} (target: ₹${alert.targetPrice.toFixed(2)})`;
                  break;
              }

              // Mark alert as triggered
              // Mark alert as triggered
              alert.isTriggered = true;
              alert.triggeredAt = new Date();
              alert.message = message;
              await alert.save();

              triggeredAlerts.push({
                alert,
                currentPrice,
                user: alert.userId
              });

              console.log(`🚨 Alert triggered: ${message} for user ${alert.userId.email}`);

              // Add to notification queue for background delivery
              try {
                await notificationQueueService.addToQueue(
                  alert.userId._id,
                  'stock_alert',
                  `Stock Alert: ${symbol}`,
                  message,
                  {
                    symbol,
                    currentPrice,
                    targetPrice: alert.targetPrice,
                    alertType: alert.alertType,
                    positionId: alert.positionId
                  }
                );
              } catch (error) {
                console.error(`❌ Error adding alert to notification queue:`, error);
              }
            }
          }

        } catch (error) {
          console.error(`❌ Error checking alerts for ${symbol}:`, error);
        }
      }

                // Send notifications for triggered alerts
          if (triggeredAlerts.length > 0) {
            console.log(`📢 Sending notifications for ${triggeredAlerts.length} triggered alerts`);
            
            for (const { alert, currentPrice, user } of triggeredAlerts) {
              try {
                // Send notification to user (if online)
                notificationService.sendStockAlert(user._id, alert, currentPrice);
                
                console.log(`✅ Notification sent for ${alert.symbol} alert to ${user.email}`);
              } catch (error) {
                console.error(`❌ Error sending notification for ${alert.symbol}:`, error);
              }
            }
          }

      console.log(`✅ Alert check completed: ${triggeredAlerts.length} alerts triggered`);

    } catch (error) {
      console.error('❌ Error in automatic alert checking:', error);
    }
  }

  // Check alerts for a specific user (for manual checking)
  async checkUserAlerts(userId) {
    try {
      const activeAlerts = await StockAlert.find({
        userId,
        isActive: true,
        isTriggered: false
      });

      if (activeAlerts.length === 0) {
        return { triggeredAlerts: [], totalActive: 0 };
      }

      const triggeredAlerts = [];
      const currentPrices = {};

      // Get current prices for all symbols
      for (const alert of activeAlerts) {
        if (!currentPrices[alert.symbol]) {
          try {
            const stockData = await fetchCurrentPrice(alert.symbol);
            currentPrices[alert.symbol] = stockData?.price || null;
          } catch (error) {
            console.error(`Error getting price for ${alert.symbol}:`, error);
            currentPrices[alert.symbol] = null;
          }
        }
      }

      // Check each alert
      for (const alert of activeAlerts) {
        const currentPrice = currentPrices[alert.symbol];
        
        if (!currentPrice) continue;

        let shouldTrigger = false;

        if (alert.alertType === 'buy') {
          shouldTrigger = currentPrice <= alert.targetPrice;
        } else if (alert.alertType === 'sell') {
          shouldTrigger = currentPrice >= alert.targetPrice;
        }

        if (shouldTrigger) {
          alert.isTriggered = true;
          alert.triggeredAt = new Date();
          await alert.save();
          
          triggeredAlerts.push(alert);
        }
      }

      return {
        triggeredAlerts,
        totalActive: activeAlerts.length,
        totalTriggered: triggeredAlerts.length
      };

    } catch (error) {
      console.error('Error checking user alerts:', error);
      throw error;
    }
  }

  // Get service status
  getStatus() {
    return {
      isRunning: this.isRunning,
      checkIntervalMs: this.checkIntervalMs,
      lastCheck: this.lastCheckTime
    };
  }

  // Update check interval
  updateInterval(intervalMs) {
    if (this.isRunning) {
      this.stop();
      this.checkIntervalMs = intervalMs;
      this.start();
    } else {
      this.checkIntervalMs = intervalMs;
    }
  }
}

// Create singleton instance
const alertService = new AlertService();

module.exports = alertService; 