const router = require('express').Router();
const jwt = require('jsonwebtoken')

const User = require('../models/User')

// Add this after your existing routes
router.get('/check', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user });
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

router.post('/register', async (req, res) => {
    try {
        let data = req.body
        const user = await User.create({ email : data.email,password: data.password});

        res.json({ user });
    } catch (error) {
        console.log({error})
        res.status(401).json({ error: 'Invalid token' });
    }
});

router.post('/login', async (req, res) => {
    try {
        
        let data = req.body
        console.log({data})
        const user = await User.findOne({ email : data.email,password: data.password});
        console.log({user})
        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET)

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user, token });
    } catch (error) {
        console.log({error})
        res.status(401).json({ error: 'Invalid token' });
    }
});

module.exports = router;