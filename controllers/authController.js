const User = require('../models/User')
const jwt = require('jsonwebtoken')

const isLogin = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        console.log({user})

        if (!user) {
            return res.status(404).json({ status: false, error: 'User not found' });
        }

        res.json({ status: true });
    } catch (error) {
        res.status(401).json({ error: 'Invalid Data!' });
    }
}

const register = async (req, res) => {
    try {
        let data = req.body
        const user = await User.create({ email : data.email,password: data.password});

        res.json({ user });
    } catch (error) {
        console.log({error})
        res.status(401).json({ error: 'Invalid Data!' });
    }
}

const login = async (req, res) => {
    try {
        
        let data = req.body
        const user = await User.findOne({ email : data.email,password: data.password});
        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET)

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user, token });
    } catch (error) {
        console.log({error})
        res.status(401).json({ error: 'Invalid Data!' });
    }
}

module.exports = {
    isLogin,
    register,
    login
}