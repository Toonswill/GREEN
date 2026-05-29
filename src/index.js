const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const path = require('path');
const { getUserByEmail, addUser } = require('./services/database');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Import routes
const authRoutes = require('./routes/auth');
const kycRoutes = require('./routes/kyc');
const walletRoutes = require('./routes/wallet');
const projectRoutes = require('./routes/projects');
const investmentRoutes = require('./routes/investments');
const adminRoutes = require('./routes/admin');
const mpesaRoutes = require('./routes/mpesa');

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/mpesa', mpesaRoutes);

// Serve HTML pages (not JSON)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Optional: Redirect old dashboard path to new one (for compatibility)
app.get('/dashboard/index.html', (req, res) => {
    res.redirect('/dashboard.html');
});

// Create admin user if not exists
async function ensureAdminExists() {
    try {
        const admin = getUserByEmail('admin@gain.com');
        if (!admin) {
            const hashedPassword = await bcrypt.hash('Admin123!', 10);
            addUser({
                firstName: 'System',
                lastName: 'Admin',
                email: 'admin@gain.com',
                phoneNumber: '254700000000',
                password: hashedPassword,
                role: 'admin',
                kycStatus: 'verified',
                walletBalance: 0,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            console.log('✅ Admin created: admin@gain.com / Admin123!');
        } else {
            console.log('✅ Admin already exists');
        }
    } catch (error) {
        console.error('Error creating admin:', error);
    }
}

// Start server
app.listen(PORT, async () => {
    await ensureAdminExists();
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   🌍 GAIN - Green Africa Investment Network       ║
║                                                                ║
║   🚀 Server: http://localhost:${PORT}                           ║
║   📱 M-Pesa: MOCK mode                                         ║
║                                                                ║
║   🔐 Admin: admin@gain.com / Admin123!                ║
║                                                                ║
║   📱 User Dashboard: http://localhost:${PORT}/dashboard.html     ║
║   🔧 Admin Panel: http://localhost:${PORT}/admin/index.html     ║
║                                                                ║
║   🇰🇪 Building for Kenya, scaling to Africa                    ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
    `);
});