const User = require('../models/User');

// Add stock to favorites
const addToFavorites = async (req, res) => {
  try {
    const { symbol } = req.body;
    const userId = req.user._id || req.user.id;

    if (!symbol) {
      return res.status(400).json({ error: 'Stock symbol is required' });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if stock is already in favorites
    if (user.favorites.includes(symbol)) {
      return res.status(400).json({ error: 'Stock already in favorites' });
    }

    // Add to favorites
    user.favorites.push(symbol);
    await user.save();

    res.json({ 
      message: 'Stock added to favorites successfully',
      favorites: user.favorites 
    });
  } catch (error) {
    console.error('Error adding to favorites:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Remove stock from favorites
const removeFromFavorites = async (req, res) => {
  try {
    const { symbol } = req.params;
    const userId = req.user._id || req.user.id;

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove from favorites
    user.favorites = user.favorites.filter(fav => fav !== symbol);
    await user.save();

    res.json({ 
      message: 'Stock removed from favorites successfully',
      favorites: user.favorites 
    });
  } catch (error) {
    console.error('Error removing from favorites:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user's favorites
const getFavorites = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ favorites: user.favorites });
  } catch (error) {
    console.error('Error getting favorites:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  addToFavorites,
  removeFromFavorites,
  getFavorites
}; 