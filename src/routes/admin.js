const express = require('express');
const router = express.Router();
const { User, users } = require('../models/User');
const { projects } = require('./projects'); // Reference to projects
const { investments } = require('./investments'); // Reference to investments
const { verifyToken, isAdmin } = require('../middlewares/auth');

// All admin routes require authentication + admin role
router.use(verifyToken, isAdmin);

// Dashboard stats
router.get('/stats', async (req, res) => {
    const allUsers = await User.findAll();
    const investors = allUsers.filter(u => u.role === 'investor');
    const developers = allUsers.filter(u => u.role === 'developer');
    const pendingKYC = allUsers.filter(u => u.kycStatus === 'pending');
    
    const totalInvestments = investments?.reduce((sum, inv) => sum + inv.amount, 0) || 0;
    const activeProjects = projects?.filter(p => p.status === 'active').length || 0;
    const fundedProjects = projects?.filter(p => p.status === 'funded').length || 0;
    
    res.json({
        success: true,
        stats: {
            totalUsers: allUsers.length,
            investors: investors.length,
            developers: developers.length,
            pendingKYC: pendingKYC.length,
            totalInvestments: totalInvestments,
            activeProjects: activeProjects,
            fundedProjects: fundedProjects,
            totalProjects: projects?.length || 0
        }
    });
});

// Get all users
router.get('/users', async (req, res) => {
    const allUsers = await User.findAll();
    res.json({
        success: true,
        count: allUsers.length,
        users: allUsers.map(u => ({
            id: u.id,
            name: `${u.firstName} ${u.lastName}`,
            email: u.email,
            phoneNumber: u.phoneNumber,
            role: u.role,
            kycStatus: u.kycStatus,
            walletBalance: u.walletBalance,
            createdAt: u.createdAt
        }))
    });
});

// Get all projects
router.get('/projects', async (req, res) => {
    res.json({
        success: true,
        count: projects?.length || 0,
        projects: projects || []
    });
});

// Approve/reject project (admin)
router.post('/projects/:projectId/approve', async (req, res) => {
    const project = projects?.find(p => p.id === parseInt(req.params.projectId));
    if (!project) {
        return res.status(404).json({ success: false, error: 'Project not found' });
    }
    
    project.status = 'active';
    project.approvedAt = new Date();
    
    res.json({
        success: true,
        message: 'Project approved and now visible to investors',
        project
    });
});

router.post('/projects/:projectId/reject', async (req, res) => {
    const project = projects?.find(p => p.id === parseInt(req.params.projectId));
    if (!project) {
        return res.status(404).json({ success: false, error: 'Project not found' });
    }
    
    project.status = 'rejected';
    
    res.json({
        success: true,
        message: 'Project rejected',
        project
    });
});

// Get all investments
router.get('/investments', async (req, res) => {
    res.json({
        success: true,
        count: investments?.length || 0,
        investments: investments || []
    });
});

module.exports = router;