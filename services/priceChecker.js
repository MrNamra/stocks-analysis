const { getStockData } = require('../utils/stockAPI');
const User = require('../models/User');
const { sendNotification } = require('./notificationService');

// Function to check price conditions for all users
exports.checkPriceConditions = async () => {
  try {
    // Get all users with their favorite stocks
    const users = await User.find().select('favorites email');
    
    // Process each user
    for (const user of users) {
      // Process each favorite stock
      for (const symbol of user.favorites) {
        try {
          const stockData = await getStockData(symbol);
          
          if (!stockData) continue;

          // Check if current price is above yesterday's close
          if (stockData.price > stockData.previousClose) {
            await sendNotification({
              email: user.email,
              message: `${symbol} is above yesterday's closing price. Current: ${stockData.price}, Previous Close: ${stockData.previousClose}`
            });
          }

          // Add more conditions here as needed
          // Example: Check stop-loss, target prices, etc.

        } catch (error) {
          console.error(`Error processing stock ${symbol} for user ${user.email}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Error in priceChecker:', error);
  }
};