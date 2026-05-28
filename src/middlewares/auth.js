const jwt = require('jsonwebtoken');
const { User } = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key_change_this';

// Generate JWT token
const generateToken = (userId, email, role) => {
    return jwt.sign(
        { id: userId, email, role },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
};

// Verify JWT token middleware
const verifyToken = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ success: false, error: 'Access denied. No token provided.' });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.id);
        
        if (!user) {
            return res.status(401).json({ success: false, error: 'User not found' });
        }
        
        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, error: 'Invalid token' });
    }
};

// Check if user is admin
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Admin access required' });
    }
    next();
};

// Check if KYC is verified (for investing)
const isKYCVerified = (req, res, next) => {
    if (req.user.kycStatus !== 'verified') {
        return res.status(403).json({ 
            success: false, 
            error: 'KYC verification required. Please submit your identification documents.' 
        });
    }
    next();
};

module.exports = { generateToken, verifyToken, isAdmin, isKYCVerified };