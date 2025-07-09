const { verifySocketToken } = require('./middleware/verifySocketToken');
const { fetchStockPrices } = require('./utils/stockAPI');
const cache = require('./cache');

const SEBI_TOP_10 = ['RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'ICICIBANK.NS', 'HINDUNILVR.NS', 'SBIN.NS', 'BHARTIARTL.NS', 'ITC.NS', 'LT.NS'];

function initSocketServer(io) {
  io.use(verifySocketToken); // Auth check on connection

  io.on('connection', (socket) => {
    console.log('✅ Authenticated socket connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('❌ Client disconnected:', socket.id);
    });
  });

  // Emit data every 5 seconds
  setInterval(async () => {
    const stockData = await fetchStockPrices(SEBI_TOP_10);
    io.emit('stockUpdate', stockData);
  }, 5000);
}

module.exports = { initSocketServer };
