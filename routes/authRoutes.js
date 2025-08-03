const router = require('express').Router();
const authController = require('../controllers/authController')

// Add this after your existing routes
router.get('/check', authController.isLogin);

router.post('/register', authController.register);

router.post('/login', authController.login);

module.exports = router;