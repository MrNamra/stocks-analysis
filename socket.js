const { verifySocketToken } = require('./middleware/verifySocketToken');
const { fetchStockPrices } = require('./utils/stockAPI');
const cache = require('./cache');

const SEBI_TOP_10 = ['RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'ICICIBANK.NS', 'HINDUNILVR.NS', 'SBIN.NS', 'BHARTIARTL.NS', 'ITC.NS', 'LT.NS'];
// const SEBI_TOP_10 = ['RELIANCE.NS'];

function initSocketServer(io) {
  io.use(verifySocketToken); // Auth check on connection

  io.on('connection', (socket) => {
    console.log('✅ Authenticated socket connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('❌ Client disconnected:', socket.id);
    });
  });

  setInterval(async () => {
    /*
    const stockData = await Promise.all(SEBI_TOP_10.map(async (symbol) => {
      const current = await fetchStockPrices(symbol);
      console.log({current})
      // const history = await fetchLast50Closes(symbol);
  
      // Calculate SMA
      // const sma = history.reduce((sum, price) => sum + price, 0) / history.length;
  
      return {
        symbol,
        name: current.name,
        price: current.price,
        // last50Closes: history,
        // sma,
      };
    }));
    */
    const stockData = await fetchStockPrices(SEBI_TOP_10)
    console.log({stockData})
    // await Promise.all(SEBI_TOP_10.map(async (symbol) => {
    //   const current = await fetchStockPrices(symbol);
    //   console.log({current})
    //   // const history = await fetchLast50Closes(symbol);
  
    //   // Calculate SMA
    //   // const sma = history.reduce((sum, price) => sum + price, 0) / history.length;
  
    //   return {
    //     symbol,
    //     name: current.name,
    //     price: current.price,
    //     // last50Closes: history,
    //     // sma,
    //   };
    // }));
  
    io.emit('stockUpdate', stockData);
  }, 5000);
}

module.exports = { initSocketServer };
