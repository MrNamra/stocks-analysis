const yahooFinance = require('yahoo-finance2').default;
const cache = require('../cache');

const CACHE_TTL = 5000;

const lastFetchTimestamps = {};

async function fetchStockPrices(symbols) {
  const now = Date.now();
  const result = {};

  for (const symbol of symbols) {
    const lastFetched = lastFetchTimestamps[symbol] || 0;
    const isFresh = now - lastFetched < CACHE_TTL;

    if (isFresh && cache[symbol]) {
      result[symbol] = cache[symbol];
    } else {
      try {
        const quote = await yahooFinance.quote(symbol);
        const price = quote.regularMarketPrice;

        if (price) {
          cache[symbol] = price;
          lastFetchTimestamps[symbol] = now;
          result[symbol] = price;
        } else {
          result[symbol] = null;
        }
      } catch (err) {
        console.error(`Error fetching ${symbol}:`, err.message);
        result[symbol] = null;
      }
    }
  }

  return result;
}

module.exports = { fetchStockPrices };
