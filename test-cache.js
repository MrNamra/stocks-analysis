const cacheManager = require('./services/cacheManager');
const { getCachedStocksForUser, getCacheStats } = require('./cache');

async function testCacheSystem() {
  console.log('🧪 Testing Cache System...\n');

  // Test 1: Check initial cache state
  console.log('1. Initial cache stats:');
  console.log(getCacheStats());
  console.log('\n');

  // Test 2: Initialize cache
  console.log('2. Initializing cache...');
  await cacheManager.updateCache(['RELIANCE.NS', 'TCS.NS']);
  console.log('\n');

  // Test 3: Check cache after initialization
  console.log('3. Cache stats after initialization:');
  console.log(getCacheStats());
  console.log('\n');

  // Test 4: Get cached stocks for user with no favorites
  console.log('4. Cached stocks for user with no favorites:');
  const defaultStocks = getCachedStocksForUser([]);
  console.log(`Found ${defaultStocks.length} default stocks:`, defaultStocks.map(s => s.symbol));
  console.log('\n');

  // Test 5: Get cached stocks for user with favorites
  console.log('5. Cached stocks for user with favorites:');
  const favoriteStocks = getCachedStocksForUser(['RELIANCE.NS', 'INFY.NS']);
  console.log(`Found ${favoriteStocks.length} favorite stocks:`, favoriteStocks.map(s => s.symbol));
  console.log('\n');

  // Test 6: Check cache health
  console.log('6. Cache health status:');
  console.log(cacheManager.getHealthStatus());
  console.log('\n');

  // Test 7: Get all cached stocks
  console.log('7. All cached stocks:');
  const allStocks = cacheManager.getAllStocks();
  console.log(`Total cached stocks: ${allStocks.length}`);
  allStocks.forEach(stock => {
    console.log(`  - ${stock.symbol}: ${stock.name} (₹${stock.price})`);
  });

  console.log('\n✅ Cache system test completed!');
}

// Run the test
testCacheSystem().catch(console.error); 