const yahooFinance = require('yahoo-finance2').default;

// Search stocks using Yahoo Finance
const searchStocks = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || !q.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const query = q.trim();
    
    // Search using Yahoo Finance
    const searchResults = await yahooFinance.search(query, {
      quotesCount: 10,
      newsCount: 0,
      enableFuzzyQuery: true
    });

    // Process and format the results
    const stocks = searchResults.quotes.map(quote => ({
      symbol: quote.symbol,
      name: quote.shortname || quote.longname || quote.symbol,
      exchange: quote.exchange,
      type: quote.quoteType,
      market: quote.market,
      price: quote.regularMarketPrice || null,
      currency: quote.currency || 'USD',
      marketCap: quote.marketCap || null
    }));

    // Filter out non-stock results (keep only stocks and ETFs)
    const filteredStocks = stocks.filter(stock => 
      stock && stock.symbol && (
        stock.type === 'EQUITY' || 
        stock.type === 'ETF' || 
        stock.symbol.includes('.NS') || // Indian stocks
        stock.symbol.includes('.BO') || // Indian stocks
        stock.symbol.includes('.NSE') || // Indian stocks
        stock.symbol.includes('.BSE') // Indian stocks
      )
    );

    res.json({
      success: true,
      data: filteredStocks.slice(0, 8), // Limit to 8 results
      total: filteredStocks.length
    });

  } catch (error) {
    console.error('Error searching stocks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search stocks. Please try again.'
    });
  }
};

// Get stock details by symbol
const getStockDetails = async (req, res) => {
  try {
    const { symbol } = req.params;
    
    if (!symbol) {
      return res.status(400).json({
        success: false,
        error: 'Stock symbol is required'
      });
    }

    // Get stock details from Yahoo Finance
    const quote = await yahooFinance.quote(symbol);
    
    const stockDetails = {
      symbol: quote.symbol,
      name: quote.shortName || quote.longName || quote.symbol,
      price: quote.regularMarketPrice,
      currency: quote.currency || 'USD',
      exchange: quote.exchange,
      marketCap: quote.marketCap,
      volume: quote.regularMarketVolume,
      change: quote.regularMarketChange,
      changePercent: quote.regularMarketChangePercent,
      previousClose: quote.regularMarketPreviousClose,
      open: quote.regularMarketOpen,
      dayHigh: quote.regularMarketDayHigh,
      dayLow: quote.regularMarketDayLow,
      yearHigh: quote.fiftyTwoWeekHigh,
      yearLow: quote.fiftyTwoWeekLow,
      peRatio: quote.trailingPE,
      dividendYield: quote.trailingAnnualDividendYield,
      sector: quote.sector,
      industry: quote.industry
    };

    res.json({
      success: true,
      data: stockDetails
    });

  } catch (error) {
    console.error('Error getting stock details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get stock details. Please try again.'
    });
  }
};

// Validate stock symbol
const validateSymbol = async (req, res) => {
  try {
    const { symbol } = req.params;
    
    if (!symbol) {
      return res.status(400).json({
        success: false,
        error: 'Stock symbol is required'
      });
    }

    // Try to get quote to validate symbol
    const quote = await yahooFinance.quote(symbol);
    
    res.json({
      success: true,
      data: {
        symbol: quote.symbol,
        name: quote.shortName || quote.longName || quote.symbol,
        isValid: true
      }
    });

  } catch (error) {
    console.error('Error validating symbol:', error);
    res.json({
      success: false,
      data: {
        symbol: req.params.symbol,
        isValid: false,
        error: 'Invalid stock symbol'
      }
    });
  }
};

module.exports = {
  searchStocks,
  getStockDetails,
  validateSymbol
}; 