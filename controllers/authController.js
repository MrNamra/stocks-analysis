const User = require('../models/User')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

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
        const { email, password, name } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create user
        const user = await User.create({ 
            email, 
            password: hashedPassword,
            name: name || email.split('@')[0] // Use email prefix if no name provided
        });

        // Remove password from response
        const userResponse = user.toObject();
        delete userResponse.password;

        res.json({ 
            success: true,
            user: userResponse,
            message: 'User registered successfully'
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
}

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

        // Remove password from response
        const userResponse = user.toObject();
        delete userResponse.password;

        res.json({ 
            success: true,
            user: userResponse, 
            token,
            message: 'Login successful'
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
}

module.exports = {
    isLogin,
    register,
    login
}