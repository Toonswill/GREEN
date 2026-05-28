const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { User } = require('../models/User');
const { generateToken, verifyToken } = require('../middlewares/auth');

// Signup
router.post('/signup', async (req, res) => {
    const { firstName, lastName, email, phoneNumber, password, role } = req.body;
    
    // Validation
    if (!firstName || !lastName || !email || !phoneNumber || !password) {
        return res.status(400).json({ 
            success: false, 
            error: 'All fields are required' 
        });
    }
    
    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
        return res.status(400).json({ 
            success: false, 
            error: 'User already exists with this email' 
        });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = await User.create({
        firstName,
        lastName,
        email,
        phoneNumber,
        password: hashedPassword,
        role: role || 'investor'
    });
    
    // Generate token
    const token = generateToken(user.id, user.email, user.role);
    
    res.status(201).json({
        success: true,
        message: 'User created successfully',
        token,
        user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            kycStatus: user.kycStatus,
            walletBalance: user.walletBalance
        }
    });
});

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ 
            success: false, 
            error: 'Email and password are required' 
        });
    }
    
    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
        return res.status(401).json({ 
            success: false, 
            error: 'Invalid credentials' 
        });
    }
    
    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
        return res.status(401).json({ 
            success: false, 
            error: 'Invalid credentials' 
        });
    }
    
    // Generate token
    const token = generateToken(user.id, user.email, user.role);
    
    res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            kycStatus: user.kycStatus,
            walletBalance: user.walletBalance
        }
    });
});

// Get current user (protected)
router.get('/me', verifyToken, async (req, res) => {
    res.json({
        success: true,
        user: {
            id: req.user.id,
            firstName: req.user.firstName,
            lastName: req.user.lastName,
            email: req.user.email,
            phoneNumber: req.user.phoneNumber,
            role: req.user.role,
            kycStatus: req.user.kycStatus,
            walletBalance: req.user.walletBalance,
            createdAt: req.user.createdAt
        }
    });
});

module.exports = router;