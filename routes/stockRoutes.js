const express = require('express');
const router = express.Router();
const { getStockData } = require('../utils/stockAPI');

router.get('/:symbol', async (req, res) => {
  try {
    const data = await getStockData(req.params.symbol);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching stock data' });
  }
});

module.exports = router;