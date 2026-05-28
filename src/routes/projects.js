const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { getProjects, addProject, updateProject, getProjectById } = require('../services/database');

// Get all projects
router.get('/', (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        let isAdmin = false;
        
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                isAdmin = decoded.role === 'admin';
            } catch(e) {}
        }
        
        let projects = getProjects();
        if (!isAdmin) {
            projects = projects.filter(p => p.status === 'active');
        }
        
        res.json({ success: true, count: projects.length, projects });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get single project
router.get('/:id', (req, res) => {
    try {
        const project = getProjectById(parseInt(req.params.id));
        if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
        res.json({ success: true, project });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create project
router.post('/', (req, res) => {
    try {
        const { title, description, sector, goalAmount, deadline, expectedReturnPercent, developerName, developerEmail, location } = req.body;
        
        if (!title || !description || !sector || !goalAmount) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }
        
        const project = {
            title,
            description,
            sector,
            goalAmount: Number(goalAmount),
            currentAmount: 0,
            deadline: new Date(deadline || Date.now() + 365*24*60*60*1000),
            expectedReturnPercent: expectedReturnPercent || 12,
            developerName: developerName || 'Unknown',
            developerEmail: developerEmail || 'unknown@email.com',
            location: location || 'Kenya',
            status: 'pending',
            createdAt: new Date(),
            investorCount: 0
        };
        
        const newProject = addProject(project);
        res.status(201).json({ success: true, message: 'Project created', project: newProject });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Approve project
router.post('/:id/approve', (req, res) => {
    try {
        const project = getProjectById(parseInt(req.params.id));
        if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
        
        const updated = updateProject(project.id, { status: 'active' });
        res.json({ success: true, message: 'Project approved', project: updated });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Reject project
router.post('/:id/reject', (req, res) => {
    try {
        const project = getProjectById(parseInt(req.params.id));
        if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
        
        const updated = updateProject(project.id, { status: 'rejected' });
        res.json({ success: true, message: 'Project rejected', project: updated });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;