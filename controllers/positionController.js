const StockPosition = require('../models/StockPosition');

// Get all positions for a user
const getUserPositions = async (req, res) => {
  try {
    const positions = await StockPosition.find({ userId: req.user.id });
    res.json({
      success: true,
      data: positions
    });
  } catch (error) {
    console.error('Error fetching user positions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch positions'
    });
  }
};

// Get position for a specific stock
const getStockPosition = async (req, res) => {
  try {
    const { symbol } = req.params;
    const position = await StockPosition.findOne({
      userId: req.user.id,
      symbol: symbol.toUpperCase()
    });
    
    res.json({
      success: true,
      data: position || null
    });
  } catch (error) {
    console.error('Error fetching stock position:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch position'
    });
  }
};

// Create or update a stock position
const createOrUpdatePosition = async (req, res) => {
  try {
    const { symbol, quantity, purchasePrice } = req.body;
    
    if (!symbol || !quantity || !purchasePrice) {
      return res.status(400).json({
        success: false,
        error: 'Symbol, quantity, and purchase price are required'
      });
    }

    const totalInvestment = quantity * purchasePrice;
    
    const position = await StockPosition.findOneAndUpdate(
      { userId: req.user.id, symbol: symbol.toUpperCase() },
      {
        quantity,
        purchasePrice,
        totalInvestment,
        lastUpdated: Date.now()
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      data: position,
      message: 'Position updated successfully'
    });
  } catch (error) {
    console.error('Error creating/updating position:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update position'
    });
  }
};

// Delete a stock position
const deletePosition = async (req, res) => {
  try {
    const { symbol } = req.params;
    
    const position = await StockPosition.findOneAndDelete({
      userId: req.user.id,
      symbol: symbol.toUpperCase()
    });

    if (!position) {
      return res.status(404).json({
        success: false,
        error: 'Position not found'
      });
    }

    res.json({
      success: true,
      message: 'Position deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting position:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete position'
    });
  }
};

// Get position summary with current market value
const getPositionSummary = async (req, res) => {
  try {
    const positions = await StockPosition.find({ userId: req.user.id });
    
    const summary = positions.map(position => {
      const currentPrice = req.body.currentPrices?.[position.symbol] || 0;
      const currentValue = position.quantity * currentPrice;
      const profitLoss = currentValue - position.totalInvestment;
      const profitLossPercentage = position.totalInvestment > 0 
        ? (profitLoss / position.totalInvestment) * 100 
        : 0;

      return {
        ...position.toObject(),
        currentPrice,
        currentValue,
        profitLoss,
        profitLossPercentage
      };
    });

    const totalInvestment = summary.reduce((sum, pos) => sum + pos.totalInvestment, 0);
    const totalCurrentValue = summary.reduce((sum, pos) => sum + pos.currentValue, 0);
    const totalProfitLoss = totalCurrentValue - totalInvestment;

    res.json({
      success: true,
      data: {
        positions: summary,
        summary: {
          totalInvestment,
          totalCurrentValue,
          totalProfitLoss,
          totalProfitLossPercentage: totalInvestment > 0 ? (totalProfitLoss / totalInvestment) * 100 : 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching position summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch position summary'
    });
  }
};

module.exports = {
  getUserPositions,
  getStockPosition,
  createOrUpdatePosition,
  deletePosition,
  getPositionSummary
}; 