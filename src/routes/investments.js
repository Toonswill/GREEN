const express = require('express');
const router = express.Router();
const { stkPush } = require('../services/mpesa');
const { getProjects, updateProject, getProjectById } = require('../services/database');
const { getInvestments, addInvestment, updateInvestment } = require('../services/database');
const { User } = require('../models/User');
const { verifyToken } = require('../middlewares/auth');

// Make an investment (REQUIRES AUTHENTICATION)
router.post('/', verifyToken, async (req, res) => {
    const { phoneNumber, amount, projectId, investorName, investorEmail } = req.body;

    console.log(`📊 Investment request from user ${req.user.id}: Amount KES ${amount}, Project ${projectId}`);

    // Validation
    if (!phoneNumber || !amount || !projectId) {
        return res.status(400).json({
            success: false,
            error: 'Phone number, amount, and project ID are required'
        });
    }

    if (amount < 10) {
        return res.status(400).json({ success: false, error: 'Minimum investment is KES 10' });
    }

    if (amount > 100000) {
        return res.status(400).json({ success: false, error: 'Maximum investment per transaction is KES 100,000 (CMA rule)' });
    }

    // Get user and check wallet balance
    const user = await User.findById(req.user.id);
    if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
    }

    console.log(`💰 User ${user.email} wallet balance: KES ${user.walletBalance}`);

    // Check if user has enough wallet balance
    if (user.walletBalance < amount) {
        return res.status(400).json({ 
            success: false, 
            error: `Insufficient wallet balance. You have KES ${user.walletBalance.toLocaleString()}. Please top up your wallet first.` 
        });
    }

    // Check project exists and is active
    const project = getProjectById(parseInt(projectId));
    if (!project) {
        return res.status(404).json({ success: false, error: 'Project not found' });
    }

    if (project.status !== 'active') {
        return res.status(400).json({ success: false, error: `Project is ${project.status}. Cannot invest.` });
    }

    // Check if investment would exceed project goal
    if (project.currentAmount + amount > project.goalAmount) {
        return res.status(400).json({ 
            success: false, 
            error: `Investment would exceed goal. Remaining: KES ${(project.goalAmount - project.currentAmount).toLocaleString()}` 
        });
    }

    try {
        // DEDUCT FROM WALLET FIRST
        const updatedUser = await User.updateWallet(req.user.id, amount, 'subtract');
        
        console.log(`✅ Wallet deducted: KES ${amount} from ${user.email}. New balance: KES ${updatedUser.walletBalance}`);

        // Create investment record as completed (since we're in mock mode and already deducted from wallet)
        const investment = addInvestment({
            investorName: investorName || `${user.firstName} ${user.lastName}`,
            investorEmail: investorEmail || user.email,
            phoneNumber: phoneNumber,
            amount: Number(amount),
            projectId: project.id,
            projectTitle: project.title,
            status: 'completed',
            createdAt: new Date(),
            completedAt: new Date()
        });

        // Update project funding
        const newAmount = project.currentAmount + amount;
        const newInvestorCount = (project.investorCount || 0) + 1;
        const newStatus = newAmount >= project.goalAmount ? 'funded' : project.status;
        
        updateProject(project.id, {
            currentAmount: newAmount,
            investorCount: newInvestorCount,
            status: newStatus
        });

        console.log(`🎉 Investment successful: KES ${amount} into ${project.title} by ${user.email}`);

        res.json({
            success: true,
            message: `Investment of KES ${amount.toLocaleString()} successful!`,
            investmentId: investment.id,
            newWalletBalance: updatedUser.walletBalance
        });

    } catch (error) {
        console.error('Investment error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get investments for the logged-in user
router.get('/', verifyToken, (req, res) => {
    const investments = getInvestments();
    const userInvestments = investments.filter(i => 
        i.phoneNumber === req.user.phoneNumber || 
        i.investorEmail === req.user.email
    );
    
    res.json({
        success: true,
        count: userInvestments.length,
        investments: userInvestments
    });
});

// Get investment by ID (user must own it)
router.get('/:id', verifyToken, (req, res) => {
    const investment = getInvestments().find(i => i.id === parseInt(req.params.id));
    
    if (!investment) {
        return res.status(404).json({ success: false, error: 'Investment not found' });
    }
    
    // Check if user owns this investment
    if (investment.phoneNumber !== req.user.phoneNumber && 
        investment.investorEmail !== req.user.email && 
        req.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Access denied' });
    }
    
    res.json({ success: true, investment });
});

// Confirm investment (manual or callback)
router.post('/:id/confirm', async (req, res) => {
    const investment = updateInvestment(parseInt(req.params.id), {
        status: 'completed',
        completedAt: new Date()
    });

    if (!investment) {
        return res.status(404).json({ success: false, error: 'Investment not found' });
    }

    // Update project funding
    const project = getProjectById(investment.projectId);
    if (project) {
        const newAmount = (project.currentAmount || 0) + investment.amount;
        const newInvestorCount = (project.investorCount || 0) + 1;
        const newStatus = newAmount >= project.goalAmount ? 'funded' : project.status;
        updateProject(project.id, {
            currentAmount: newAmount,
            investorCount: newInvestorCount,
            status: newStatus
        });
    }

    res.json({
        success: true,
        message: 'Investment confirmed',
        investment
    });
});

module.exports = router;