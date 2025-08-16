const { verifySocketToken } = require('./middleware/verifySocketToken');
const { fetchCurrentPrice, initializeCache } = require('./utils/stockAPI');
const { getCachedStocksForUser, isCacheValid, getCacheStats } = require('./cache');
const cacheManager = require('./services/cacheManager');
const notificationService = require('./services/notificationService');
const alertService = require('./services/alertService');
const User = require('./models/User');

function initSocketServer(io) {
  // Remove middleware auth check - we'll handle auth in connection
  // io.use(verifySocketToken); // Auth check on connection

  io.on('connection', (socket) => {
    console.log('🔌 New socket connected:', socket.id);
    
    // Handle authentication message from WebSocket clients
    socket.on('auth', async (data) => {
      try {
        const { token } = data;
        // console.log('🔑 Token received:', token);
        
        if (!token) {
          socket.emit('auth_error', { message: 'No token provided' });
          return;
        }

        // Verify token
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Attach user to socket
        socket.user = decoded;
        
        // console.log('✅ Socket authenticated for user:', decoded.email || decoded.id);
        
        // Register user for notifications
        notificationService.registerUser(socket.user.id, socket);
        
        // Send authentication success
        socket.emit('auth_success', { message: 'Authentication successful' });
        
        // Send cached data immediately if available
        await sendCachedDataToUser(socket);
        
      } catch (error) {
        console.error('❌ Socket authentication failed:', error.message);
        socket.emit('auth_error', { message: 'Invalid token' });
      }
    });

    // Handle WebSocket-style messages (for native WebSocket clients)
    socket.on('message', async (data) => {
      try {
        const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
        
        if (parsedData.type === 'auth') {
          const { token } = parsedData;
          // console.log('🔑 Token received via message:', token);
          
          if (!token) {
            socket.emit('auth_error', { message: 'No token provided' });
            return;
          }

          // Verify token
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          
          // Attach user to socket
          socket.user = decoded;
          
          // console.log('✅ Socket authenticated for user:', decoded.email || decoded.id);
          
          // Register user for notifications
          notificationService.registerUser(socket.user.id, socket);
          
          // Send authentication success
          socket.emit('auth_success', { message: 'Authentication successful' });
          
          // Send cached data immediately if available
          await sendCachedDataToUser(socket);
          
        }
      } catch (error) {
        console.error('❌ Socket message handling failed:', error.message);
        socket.emit('auth_error', { message: 'Invalid message format' });
      }
    });

    socket.on('disconnect', () => {
      // console.log('❌ Client disconnected:', socket.id);
      // Unregister user from notifications if authenticated
      if (socket.user) {
        notificationService.unregisterUser(socket.user.id);
      }
    });
  });

  // Initialize cache on server start
  initializeCache();

  // Start cache manager service with faster updates
  cacheManager.startUpdateService(5000); // 5 seconds for real-time updates

  // Start automatic alert checking service
  alertService.start();

  // Send updated data to all connected users every 5 seconds
  setInterval(async () => {
    const connectedSockets = await io.fetchSockets();
    for (const socket of connectedSockets) {
      await sendCachedDataToUser(socket);
    }
  }, 5000); // Send updates every 5 seconds
}

async function sendCachedDataToUser(socket) {
  try {
    // Get user's favorites
    const user = await User.findById(socket.user.id);
    const userFavorites = user?.favorites || [];

    // Get cached data for user (favorites or defaults)
    const cachedStocks = getCachedStocksForUser(userFavorites);

    if (cachedStocks.length > 0) {
      // Process the cached data to add SMA calculations
      const processedStocks = cachedStocks.map(stock => {
        const history = stock.fiftyDayAverage || [];
        const detailedHistory = stock.detailedHistory || [];
        const sma = history.length > 0 
          ? history.reduce((sum, price) => sum + price, 0) / history.length 
          : 0;

        return {
          symbol: stock.symbol,
          name: stock.name,
          price: stock.price,
          last50daysAvg: history,
          detailedHistory: detailedHistory,
          sma: parseFloat(sma.toFixed(2)),
          isDefault: stock.isDefault,
          lastUpdated: stock.lastUpdated
        };
      });

      socket.emit('stockUpdate', processedStocks);
      // console.log(`📊 Sent ${processedStocks.length} cached stocks to user ${user?.email || socket.user.id}`);
    } else {
      // If no cached data, fetch fresh data
      // console.log('⚠️ No cached data available, fetching fresh data...');
      await sendUserFavoritesData(socket);
    }
  } catch (error) {
    console.error('Error sending cached data to user:', error);
    socket.emit('stockUpdate', []);
  }
}



async function sendUserFavoritesData(socket) {
  try {
    // Get user's favorites
    const user = await User.findById(socket.user.id);
    let stocksToFetch = [];

    if (!user || !user.favorites || user.favorites.length === 0) {
      // If user has no favorites, show default stocks
      const { DEFAULT_STOCKS } = require('./cache');
      stocksToFetch = DEFAULT_STOCKS;
      // console.log(`📊 User ${user?.email || socket.user.id} has no favorites, showing default stocks`);
    } else {
      // Use user's favorites
      stocksToFetch = user.favorites;
      // console.log(`📊 User ${user.email} favorites:`, user.favorites);
    }

    // Fetch data for stocks
    const stockData = await Promise.all(stocksToFetch.map(async (symbol) => {
      try {
        const current = await fetchCurrentPrice(symbol);
        const history = current.fiftyDayAverage || [];
        
        // Calculate SMA
        const sma = history.length > 0 
          ? history.reduce((sum, price) => sum + price, 0) / history.length 
          : 0;

        return {
          symbol,
          name: current.name,
          price: current.price,
          last50daysAvg: history,
          detailedHistory: current.detailedHistory || [],
          sma: parseFloat(sma.toFixed(2)),
          isDefault: !user?.favorites?.includes(symbol), // Flag to indicate if this is from default list
          lastUpdated: current.lastUpdated
        };
      } catch (error) {
        console.error(`Error fetching data for ${symbol}:`, error);
        return {
          symbol,
          name: symbol,
          price: null,
          last50daysAvg: [],
          sma: 0,
          isDefault: !user?.favorites?.includes(symbol),
          lastUpdated: Date.now(),
          error: 'Failed to fetch data'
        };
      }
    }));

    socket.emit('stockUpdate', stockData);
  } catch (error) {
    console.error('Error sending user favorites data:', error);
    socket.emit('stockUpdate', []);
  }
}

module.exports = { initSocketServer };
