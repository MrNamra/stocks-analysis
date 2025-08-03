const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const favoriteController = require('../controllers/favoriteController');

// All routes require authentication
router.use(authenticateToken);

// Add stock to favorites
router.post('/add', favoriteController.addToFavorites);

// Remove stock from favorites
router.delete('/remove/:symbol', favoriteController.removeFromFavorites);

// Get user's favorites
router.get('/', favoriteController.getFavorites);

module.exports = router; 