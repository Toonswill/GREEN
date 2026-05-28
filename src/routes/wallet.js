const express = require('express');
const router = express.Router();
const { User } = require('../models/User');
const { verifyToken, isKYCVerified } = require('../middlewares/auth');
const { stkPush } = require('../services/mpesa');

// Get wallet balance
router.get('/balance', verifyToken, async (req, res) => {
    res.json({
        success: true,
        balance: req.user.walletBalance,
        currency: 'KES'
    });
});

// Deposit via M-Pesa (STK Push)
// Deposit via M-Pesa (STK Push)
router.post('/deposit', verifyToken, async (req, res) => {
    const { amount, phoneNumber } = req.body;
    
    if (!amount || amount < 10) {
        return res.status(400).json({ 
            success: false, 
            error: 'Minimum deposit is KES 10' 
        });
    }
    
    if (amount > 500000) {
        return res.status(400).json({ 
            success: false, 
            error: 'Maximum deposit is KES 500,000' 
        });
    }
    
    const userPhone = phoneNumber || req.user.phoneNumber;
    
    try {
        // In mock mode, just add to wallet directly
        if (process.env.MOCK_MODE === 'true') {
            // Add money to wallet
            const updatedUser = await User.updateWallet(req.user.id, amount, 'add');
            
            // Create a deposit record (optional)
            console.log(`💰 Mock deposit: KES ${amount} added to user ${req.user.email}. New balance: KES ${updatedUser.walletBalance}`);
            
            return res.json({
                success: true,
                message: `KES ${amount} deposited successfully!`,
                newBalance: updatedUser.walletBalance
            });
        }
        
        // Real M-Pesa mode
        const mpesaResponse = await stkPush(userPhone, amount, `DEPOSIT-${req.user.id}`);
        
        res.json({
            success: true,
            message: 'STK Push sent. Enter M-Pesa PIN to complete deposit.',
            checkoutRequestId: mpesaResponse.CheckoutRequestID,
            amount: amount
        });
    } catch (error) {
        console.error('Deposit error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Withdraw from wallet (to M-Pesa)
router.post('/withdraw', verifyToken, async (req, res) => {
    const { amount, phoneNumber } = req.body;
    
    if (!amount || amount < 100) {
        return res.status(400).json({ 
            success: false, 
            error: 'Minimum withdrawal is KES 100' 
        });
    }
    
    if (amount > req.user.walletBalance) {
        return res.status(400).json({ 
            success: false, 
            error: `Insufficient balance. Available: KES ${req.user.walletBalance}` 
        });
    }
    
    // In production, call M-Pesa B2C API to send money
    // For now, just deduct from wallet
    await User.updateWallet(req.user.id, amount, 'subtract');
    
    res.json({
        success: true,
        message: `KES ${amount} withdrawn. Money will be sent to ${phoneNumber || req.user.phoneNumber}`,
        newBalance: req.user.walletBalance - amount
    });
});

// Get wallet transactions
router.get('/transactions', verifyToken, async (req, res) => {
    // In production, query Transaction model
    res.json({
        success: true,
        transactions: [] // Add transactions list
    });
});

module.exports = router;