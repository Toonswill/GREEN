const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const { User } = require('../models/User');
const { verifyToken, isAdmin } = require('../middlewares/auth');

// Configure multer for file uploads (in-memory for now)
const storage = multer.memoryStorage();
const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only JPEG, PNG, and PDF files are allowed'));
        }
    }
});

// Submit KYC documents
router.post('/submit', verifyToken, upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                error: 'Please upload a valid ID document (JPEG, PNG, or PDF)' 
            });
        }
        
        // In production, save file to cloud storage (AWS S3, etc.)
        // For now, store as base64 (not recommended for production)
        const documentBase64 = req.file.buffer.toString('base64');
        const documentUrl = `data:${req.file.mimetype};base64,${documentBase64}`;
        
        const user = await User.updateKYC(req.user.id, documentUrl);
        
        res.json({
            success: true,
            message: 'KYC documents submitted successfully. Awaiting verification.',
            kycStatus: user.kycStatus
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Get KYC status
router.get('/status', verifyToken, async (req, res) => {
    res.json({
        success: true,
        kycStatus: req.user.kycStatus,
        message: req.user.kycStatus === 'pending' ? 'Your documents are being reviewed' :
                 req.user.kycStatus === 'verified' ? 'Your identity is verified' :
                 req.user.kycStatus === 'rejected' ? 'Your documents were rejected. Please resubmit.' :
                 'Please submit your KYC documents'
    });
});

// Admin: Get all pending KYC submissions
router.get('/pending', verifyToken, isAdmin, async (req, res) => {
    const users = await User.findAll();
    const pendingKYC = users.filter(u => u.kycStatus === 'pending' && u.kycDocumentUrl);
    
    res.json({
        success: true,
        count: pendingKYC.length,
        submissions: pendingKYC.map(u => ({
            userId: u.id,
            name: `${u.firstName} ${u.lastName}`,
            email: u.email,
            phoneNumber: u.phoneNumber,
            documentUrl: u.kycDocumentUrl,
            submittedAt: u.updatedAt
        }))
    });
});

// Admin: Approve KYC
router.post('/approve/:userId', verifyToken, isAdmin, async (req, res) => {
    const user = await User.approveKYC(req.params.userId);
    
    if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    res.json({
        success: true,
        message: `KYC approved for ${user.firstName} ${user.lastName}`,
        user: { id: user.id, name: `${user.firstName} ${user.lastName}`, kycStatus: user.kycStatus }
    });
});

// Admin: Reject KYC
router.post('/reject/:userId', verifyToken, isAdmin, async (req,res) => {
    const user = await User.rejectKYC(req.params.userId);
    
    if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    res.json({
        success: true,
        message: `KYC rejected for ${user.firstName} ${user.lastName}`,
        user: { id: user.id, name: `${user.firstName} ${user.lastName}`, kycStatus: user.kycStatus }
    });
});

module.exports = router;