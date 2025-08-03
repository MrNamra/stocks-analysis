const yahooFinance = require('yahoo-finance2').default;
const { getCachedStock, setCachedStock, initializeCache, DEFAULT_STOCKS } = require('../cache');

// Fetch current price and name for a single stock
async function fetchCurrentPrice(symbol) {
  // Check global cache first
  const cached = getCachedStock(symbol);
  if (cached) {
    console.log(`📊 Using cached data for ${symbol}`);
    return cached;
  }

  try {
    console.log(`🌐 Fetching fresh data for ${symbol} from Yahoo Finance`);
    const quote = await yahooFinance.quote(symbol);
    const price = quote.regularMarketPrice;
    const name = quote.shortName || quote.longName || symbol;

    if (price) {
      // Try to get detailed historical data for better charting
      let detailedHistory = [];
      let historicalData = [];
      try {
        detailedHistory = await fetchDetailedHistory(symbol);
        historicalData = detailedHistory.map(bar => bar.close);
        console.log(`📈 Fetched ${detailedHistory.length} days of detailed historical data for ${symbol}`);
      } catch (histError) {
        console.log(`⚠️ Could not fetch detailed historical data for ${symbol}:`, histError.message);
        // Use fiftyDayAverage as fallback if available
        if (quote.fiftyDayAverage && Array.isArray(quote.fiftyDayAverage)) {
          historicalData = quote.fiftyDayAverage;
        }
      }

      const stockData = {
        price,
        name,
        fiftyDayAverage: historicalData,
        detailedHistory: detailedHistory,
        lastUpdated: Date.now()
      };

      // Store in global cache
      setCachedStock(symbol, stockData);
      return stockData;
    } else {
      return { price: null, name: symbol, fiftyDayAverage: [], lastUpdated: Date.now() };
    }
  } catch (err) {
    console.error(`Error fetching current price for ${symbol}:`, err.message);
    return { price: null, name: symbol, fiftyDayAverage: [], lastUpdated: Date.now() };
  }
}

// Fetch detailed historical data for a single stock
async function fetchDetailedHistory(symbol) {
  try {
    const now = new Date();
    const period1 = new Date(now);
    period1.setDate(now.getDate() - 60); // Fetch 60 days to account for weekends/holidays

    const history = await yahooFinance.historical(symbol, {
      period1,
      period2: now,
      interval: '1d'
    });

    // Filter out null data and get last 50 days
    const detailedData = history
      .filter(bar => bar.close != null && bar.open != null)
      .slice(-50)
      .map((bar, index) => {
        // Calculate 50-day SMA for each day
        const sma = calculateSMA(history.slice(-50), index + 1);
        
        return {
          date: bar.date,
          open: bar.open,
          high: bar.high,
          low: bar.low,
          close: bar.close,
          volume: bar.volume,
          sma: sma
        };
      });

    return detailedData;
  } catch (err) {
    console.error(`Error fetching detailed historical data for ${symbol}:`, err.message);
    return [];
  }
}

// Calculate SMA for a given number of days
function calculateSMA(data, days) {
  if (data.length < days) return 0;
  
  const relevantData = data.slice(-days);
  const sum = relevantData.reduce((acc, bar) => acc + bar.close, 0);
  return sum / days;
}

// Fetch last 50 days of closing prices for a single stock (legacy function)
async function fetchLast50Closes(symbol) {
  try {
    const detailedData = await fetchDetailedHistory(symbol);
    return detailedData.map(bar => bar.close);
  } catch (err) {
    console.error(`Error fetching historical data for ${symbol}:`, err.message);
    return [];
  }
}

// Initialize cache with default stocks
async function initializeStockCache() {
  console.log('🚀 Initializing global stock cache with default stocks...');
  initializeCache(); // Mark cache as initialized
  
  const promises = DEFAULT_STOCKS.map(symbol => fetchCurrentPrice(symbol));
  
  try {
    await Promise.all(promises);
    console.log('✅ Global stock cache initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing cache:', error);
  }
}

// Fetch multiple stocks efficiently
async function fetchStockPrices(symbols) {
  const result = {};
  
  for (const symbol of symbols) {
    try {
      const data = await fetchCurrentPrice(symbol);
      result[symbol] = data;
    } catch (error) {
      console.error(`Error fetching ${symbol}:`, error);
      result[symbol] = null;
    }
  }
  
  return result;
}

module.exports = { 
  fetchStockPrices,
  fetchCurrentPrice,
  fetchLast50Closes,
  initializeCache: initializeStockCache
};
