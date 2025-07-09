const cron = require('node-cron');
const { checkPriceConditions } = require('./priceChecker');

exports.initializeScheduler = () => {
  // Run every day at 15:20 IST (09:50 UTC)
  cron.schedule('50 9 * * *', () => {
    console.log('Running 3:20 PM IST price check...');
    checkPriceConditions();
  });

  // Optional: Run every minute for testing
  cron.schedule('* * * * *', () => {
    console.log('Running test price check...');
    checkPriceConditions();
  });

  console.log('Scheduled jobs initialized');
};