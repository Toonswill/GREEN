const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const path = require('path');
const { getUserByEmail, addUser } = require('./services/database');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ========== CORS CONFIGURATION (MUST BE BEFORE ROUTES) ==========
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5000',
    'https://green-ztje.onrender.com'
];

app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) === -1) {
            console.log('Blocked origin:', origin);
            return callback(null, false);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());

// ========== MIDDLEWARE ==========
app.use(express.json());
app.use(express.static('public'));

// ========== API ROUTES ==========
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

// ========== FRONTEND ROUTES ==========
// Serve dashboard.html at root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

// Redirect old dashboard path
app.get('/dashboard/index.html', (req, res) => {
    res.redirect('/dashboard.html');
});

// ========== CREATE ADMIN USER ==========
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

// ========== START SERVER ==========
app.listen(PORT, async () => {
    await ensureAdminExists();
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   🌍 GAIN - Green Africa Investment Network                    ║
║                                                                ║
║   🚀 Server: http://localhost:${PORT}                           ║
║   📱 M-Pesa: MOCK mode                                         ║
║                                                                ║
║   🔐 Admin: admin@gain.com / Admin123!                         ║
║                                                                ║
║   📱 User Dashboard: http://localhost:${PORT}/                  ║
║   🔧 Admin Panel: http://localhost:${PORT}/admin/index.html     ║
║                                                                ║
║   🇰🇪 Building for Kenya, scaling to Africa                    ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
    `);
});