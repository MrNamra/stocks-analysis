const { getStockData } = require('../utils/stockAPI');

const getStockData = async (req, res) => {
    try {
      const data = await getStockData(req.params.symbol);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching stock data' });
    }
}

module.exports = {
  getStockData
}