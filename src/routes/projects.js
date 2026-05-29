const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { getProjects, addProject, updateProject, getProjectById } = require('../services/database');

// Get all projects - PUBLIC sees only active, ADMIN sees all
router.get('/', (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        let isAdmin = false;
        
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                isAdmin = decoded.role === 'admin';
            } catch(e) {
                console.log('Token verification failed:', e.message);
            }
        }
        
        let projects = getProjects();
        
        // Log for debugging
        console.log(`📊 Projects request - isAdmin: ${isAdmin}, total projects: ${projects.length}`);
        
        // Only show active projects to non-admin users
        if (!isAdmin) {
            projects = projects.filter(p => p.status === 'active');
        }
        
        res.json({
            success: true,
            count: projects.length,
            projects
        });
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get single project
router.get('/:id', (req, res) => {
    try {
        const project = getProjectById(parseInt(req.params.id));
        if (!project) {
            return res.status(404).json({ success: false, error: 'Project not found' });
        }
        res.json({ success: true, project });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create a new project
router.post('/', (req, res) => {
    try {
        console.log('📝 Received project creation request');
        console.log('Request body:', req.body);
        
        const {
            title,
            description,
            sector,
            goalAmount,
            deadline,
            expectedReturnPercent,
            developerName,
            developerEmail,
            location,
            imageUrl,
            gainScore,
            duration
        } = req.body;

        if (!title || !description || !sector || !goalAmount) {
            console.log('❌ Missing required fields');
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: title, description, sector, goalAmount'
            });
        }

        const project = {
            title,
            description,
            sector,
            goalAmount: Number(goalAmount),
            currentAmount: 0,
            deadline: deadline ? new Date(deadline) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            expectedReturnPercent: expectedReturnPercent || 12,
            developerName: developerName || 'Unknown',
            developerEmail: developerEmail || 'unknown@email.com',
            location: location || 'Kenya',
            imageUrl: imageUrl || null,
            gainScore: gainScore || 'A',
            duration: duration || '36',
            status: 'pending',
            createdAt: new Date(),
            investorCount: 0
        };

        console.log('📝 Creating project:', project.title, 'with status:', project.status);

        const newProject = addProject(project);
        
        console.log('✅ Project created successfully with ID:', newProject.id);
        
        res.status(201).json({
            success: true,
            message: 'Project created successfully. Awaiting admin approval.',
            project: newProject
        });
    } catch (error) {
        console.error('❌ Error creating project:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Admin: Approve project
router.post('/:id/approve', (req, res) => {
    try {
        const projectId = parseInt(req.params.id);
        const project = getProjectById(projectId);
        
        if (!project) {
            return res.status(404).json({ success: false, error: 'Project not found' });
        }
        
        console.log(`✅ Approving project: ${project.title} (ID: ${projectId})`);
        
        const updated = updateProject(projectId, { 
            status: 'active',
            approvedAt: new Date()
        });
        
        res.json({ 
            success: true, 
            message: 'Project approved and now visible to users', 
            project: updated 
        });
    } catch (error) {
        console.error('Error approving project:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Admin: Reject project
router.post('/:id/reject', (req, res) => {
    try {
        const projectId = parseInt(req.params.id);
        const project = getProjectById(projectId);
        
        if (!project) {
            return res.status(404).json({ success: false, error: 'Project not found' });
        }
        
        console.log(`❌ Rejecting project: ${project.title} (ID: ${projectId})`);
        
        const updated = updateProject(projectId, { status: 'rejected' });
        
        res.json({ 
            success: true, 
            message: 'Project rejected', 
            project: updated 
        });
    } catch (error) {
        console.error('Error rejecting project:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;