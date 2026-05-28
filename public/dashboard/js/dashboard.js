// API Configuration
const API_URL = 'http://localhost:3000/api';
let currentUser = null;
let currentToken = null;
let selectedProject = null;

// Check if user is logged in on page load
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (token) {
        currentToken = token;
        verifyAndLoad();
    } else {
        showLogin();
    }
});

async function verifyAndLoad() {
    try {
        const response = await fetch(`${API_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            showDashboard();
            loadProjects();
            loadWallet();
            loadProfile();
            updateStats();
            document.getElementById('welcome-name').innerText = `Welcome back, ${currentUser.firstName}!`;
        } else {
            localStorage.removeItem('token');
            showLogin();
        }
    } catch (error) {
        console.error('Verification error:', error);
        showLogin();
    }
}

// ========== AUTHENTICATION ==========
async function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentToken = data.token;
            currentUser = data.user;
            localStorage.setItem('token', data.token);
            showDashboard();
            loadProjects();
            loadWallet();
            loadProfile();
            updateStats();
            document.getElementById('welcome-name').innerText = `Welcome back, ${currentUser.firstName}!`;
            showToast('Login successful!', 'success');
        } else {
            showToast('Login failed: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast('Connection error. Make sure server is running on port 3000', 'error');
    }
}

async function signup() {
    const firstName = document.getElementById('signup-firstname').value;
    const lastName = document.getElementById('signup-lastname').value;
    const email = document.getElementById('signup-email').value;
    let phone = document.getElementById('signup-phone').value;
    const password = document.getElementById('signup-password').value;
    
    phone = phone.replace(/^0/, '254');
    
    try {
        const response = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ firstName, lastName, email, phoneNumber: phone, password, role: 'investor' })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentToken = data.token;
            currentUser = data.user;
            localStorage.setItem('token', data.token);
            showDashboard();
            loadProjects();
            loadWallet();
            loadProfile();
            showToast('Account created successfully!', 'success');
        } else {
            showToast('Signup failed: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Signup error:', error);
        showToast('Connection error. Make sure server is running on port 3000', 'error');
    }
}

function showLogin() {
    document.getElementById('login-card').style.display = 'block';
    document.getElementById('signup-card').style.display = 'none';
}

function showSignup() {
    document.getElementById('login-card').style.display = 'none';
    document.getElementById('signup-card').style.display = 'block';
}

function showDashboard() {
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
}

function logout() {
    localStorage.removeItem('token');
    currentToken = null;
    currentUser = null;
    document.getElementById('auth-container').style.display = 'flex';
    document.getElementById('dashboard').style.display = 'none';
    showLogin();
    showToast('Logged out successfully', 'success');
}

// ========== TAB NAVIGATION ==========
function switchTab(tabName) {
    // Hide all content
    document.getElementById('projects-content').style.display = 'none';
    document.getElementById('portfolio-content').style.display = 'none';
    document.getElementById('wallet-content').style.display = 'none';
    document.getElementById('impact-content').style.display = 'none';
    document.getElementById('profile-content').style.display = 'none';
    
    // Show selected content
    document.getElementById(`${tabName}-content`).style.display = 'block';
    
    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Refresh data
    if (tabName === 'portfolio') loadPortfolio();
    if (tabName === 'wallet') loadWallet();
    if (tabName === 'impact') loadImpact();
}

// ========== PROJECTS ==========
async function loadProjects() {
    const container = document.getElementById('projects-list');
    container.innerHTML = '<div class="loading"><div class="loading-spinner"></div>Loading projects...</div>';
    
    try {
        const response = await fetch(`${API_URL}/projects`);
        const data = await response.json();
        
        if (data.success && data.projects && data.projects.length > 0) {
            container.innerHTML = data.projects.map(project => `
                <div class="project-card" onclick="showInvestModal(${project.id}, '${project.title}', '${project.description}', ${project.expectedReturnPercent})">
                    <div class="project-badge">
                        <span>${getSectorIcon(project.sector)}</span>
                        <span>${project.sector}</span>
                    </div>
                    <div class="project-title">${project.title}</div>
                    <div class="project-description">${project.description.substring(0, 80)}...</div>
                    <div class="progress-section">
                        <div class="progress-bar-container">
                            <div class="progress-bar" style="width: ${(project.currentAmount / project.goalAmount) * 100}%"></div>
                        </div>
                        <div class="progress-stats">
                            <span>KES ${project.currentAmount.toLocaleString()} raised</span>
                            <span>${((project.currentAmount / project.goalAmount) * 100).toFixed(0)}%</span>
                        </div>
                    </div>
                    <div class="project-footer">
                        <span class="roi-badge">${project.expectedReturnPercent}% ROI</span>
                        <span class="investors-count">👥 ${project.investorCount || 0} investors</span>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🌱</div>No projects yet.<br>Create your first project!</div>';
        }
    } catch (error) {
        console.error('Load projects error:', error);
        container.innerHTML = '<div class="empty-state">⚠️ Could not load projects</div>';
    }
}

function showCreateForm() {
    document.getElementById('create-project-panel').style.display = 'block';
}

function hideCreateForm() {
    document.getElementById('create-project-panel').style.display = 'none';
    document.getElementById('new-title').value = '';
    document.getElementById('new-desc').value = '';
    document.getElementById('new-goal').value = '';
    document.getElementById('new-return').value = '12';
}

async function createNewProject() {
    const title = document.getElementById('new-title').value;
    const description = document.getElementById('new-desc').value;
    const sector = document.getElementById('new-sector').value;
    const goalAmount = parseInt(document.getElementById('new-goal').value);
    const expectedReturnPercent = parseInt(document.getElementById('new-return').value);
    
    if (!title || !description || !goalAmount) {
        showToast('Please fill all fields', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/projects`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify({
                title, description, sector, goalAmount, expectedReturnPercent,
                deadline: '2025-12-31',
                developerName: currentUser.firstName + ' ' + currentUser.lastName,
                developerEmail: currentUser.email,
                location: 'Kenya'
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Project created successfully!', 'success');
            hideCreateForm();
            loadProjects();
            updateStats();
        } else {
            showToast('Error: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Create project error:', error);
        showToast('Failed to create project', 'error');
    }
}

// ========== INVESTMENTS ==========
function showInvestModal(projectId, title, description, returns) {
    selectedProject = { id: projectId, title, description, returns };
    document.getElementById('invest-title').innerText = title;
    document.getElementById('invest-desc').innerText = description.substring(0, 100);
    
    const balance = currentUser?.walletBalance || 0;
    document.getElementById('invest-wallet-balance').innerHTML = `KES ${balance.toLocaleString()}`;
    document.getElementById('invest-modal').style.display = 'flex';
}

function closeInvestModal() {
    document.getElementById('invest-modal').style.display = 'none';
    selectedProject = null;
    document.getElementById('invest-amount').value = '';
}

async function confirmInvestment() {
    const amount = parseInt(document.getElementById('invest-amount').value);
    
    if (!amount || amount < 10) {
        showToast('Minimum investment is KES 10', 'error');
        return;
    }
    
    if (amount > 100000) {
        showToast('Maximum investment is KES 100,000', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/investments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify({
                phoneNumber: currentUser.phoneNumber,
                amount: amount,
                projectId: selectedProject.id,
                investorName: currentUser.firstName + ' ' + currentUser.lastName,
                investorEmail: currentUser.email
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            await fetch(`${API_URL}/investments/${data.investmentId}/confirm`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${currentToken}` }
            });
            
            showToast('Investment successful!', 'success');
            closeInvestModal();
            loadProjects();
            loadWallet();
            loadPortfolio();
            updateStats();
            loadImpact();
        } else {
            showToast('Investment failed: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Investment error:', error);
        showToast('Investment failed', 'error');
    }
}

// ========== WALLET ==========
async function loadWallet() {
    try {
        const response = await fetch(`${API_URL}/wallet/balance`, {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('wallet-balance').innerHTML = `KES ${data.balance.toLocaleString()}`;
            if (currentUser) currentUser.walletBalance = data.balance;
        }
    } catch (error) {
        console.error('Load wallet error:', error);
    }
}

function showDepositModal() {
    document.getElementById('deposit-modal').style.display = 'flex';
}

function closeDepositModal() {
    document.getElementById('deposit-modal').style.display = 'none';
    document.getElementById('deposit-amount').value = '';
    document.getElementById('deposit-phone').value = '';
}

async function confirmDeposit() {
    const amount = parseInt(document.getElementById('deposit-amount').value);
    let phone = document.getElementById('deposit-phone').value;
    phone = phone.replace(/^0/, '254');
    
    if (!amount || amount < 10) {
        showToast('Minimum deposit is KES 10', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/wallet/deposit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify({ amount, phoneNumber: phone })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast(`KES ${amount.toLocaleString()} deposited!`, 'success');
            closeDepositModal();
            loadWallet();
            updateStats();
        } else {
            showToast('Deposit failed: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Deposit error:', error);
        showToast('Deposit failed', 'error');
    }
}

async function withdraw() {
    const amount = prompt('Enter amount to withdraw (KES):');
    if (!amount) return;
    
    try {
        const response = await fetch(`${API_URL}/wallet/withdraw`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify({ amount: parseInt(amount), phoneNumber: currentUser.phoneNumber })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast(`KES ${amount} withdrawn!`, 'success');
            loadWallet();
            updateStats();
        } else {
            showToast('Withdrawal failed: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Withdrawal error:', error);
        showToast('Withdrawal failed', 'error');
    }
}

// ========== PORTFOLIO ==========
async function loadPortfolio() {
    const container = document.getElementById('investments-list');
    container.innerHTML = '<div class="loading"><div class="loading-spinner"></div>Loading investments...</div>';
    
    try {
        const response = await fetch(`${API_URL}/investments?phoneNumber=${currentUser?.phoneNumber}`, {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        const data = await response.json();
        
        if (data.success && data.investments && data.investments.length > 0) {
            const completed = data.investments.filter(i => i.status === 'completed');
            const total = completed.reduce((s, i) => s + i.amount, 0);
            
            if (completed.length > 0) {
                container.innerHTML = `
                    <div style="background: white; border-radius: 20px; padding: 16px; margin-bottom: 16px;">
                        <div style="font-size: 24px; font-weight: 700; color: #1a7f4b;">KES ${total.toLocaleString()}</div>
                        <div style="color: #666;">Total Invested</div>
                    </div>
                    ${completed.map(i => `
                        <div class="investment-item">
                            <div class="investment-header">
                                <span class="investment-title">${i.projectTitle}</span>
                                <span class="investment-status status-completed">✓ Confirmed</span>
                            </div>
                            <div>KES ${i.amount.toLocaleString()}</div>
                            <small style="color: #666;">${new Date(i.createdAt).toLocaleDateString()}</small>
                        </div>
                    `).join('')}
                `;
            } else {
                container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div>No completed investments yet</div>';
            }
        } else {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div>No investments yet</div>';
        }
    } catch (error) {
        console.error('Load portfolio error:', error);
        container.innerHTML = '<div class="empty-state">⚠️ Could not load portfolio</div>';
    }
}

// ========== IMPACT ==========
async function loadImpact() {
    try {
        const response = await fetch(`${API_URL}/investments?phoneNumber=${currentUser?.phoneNumber}`, {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        const data = await response.json();
        
        let totalInvested = 0;
        if (data.success && data.investments) {
            totalInvested = data.investments.reduce((sum, inv) => sum + (inv.status === 'completed' ? inv.amount : 0), 0);
        }
        
        const co2Avoided = (totalInvested / 50000).toFixed(1);
        const treesEquivalent = Math.round(co2Avoided * 100);
        const impactPoints = Math.round(totalInvested / 1000);
        
        document.getElementById('impact-co2').innerText = `${co2Avoided} tons`;
        document.getElementById('impact-trees').innerText = treesEquivalent;
        document.getElementById('impact-points').innerText = impactPoints;
    } catch (error) {
        console.error('Load impact error:', error);
    }
}

// ========== PROFILE ==========
function loadProfile() {
    if (currentUser) {
        document.getElementById('profile-name').innerHTML = `${currentUser.firstName} ${currentUser.lastName}`;
        document.getElementById('profile-email').innerHTML = currentUser.email;
        document.getElementById('profile-phone').innerHTML = currentUser.phoneNumber;
        
        const kycStatus = currentUser.kycStatus;
        let statusText = 'Not Submitted';
        if (kycStatus === 'verified') statusText = '✅ Verified';
        else if (kycStatus === 'pending') statusText = '⏳ Pending Review';
        document.getElementById('profile-kyc').innerHTML = statusText;
    }
}

async function submitKYC() {
    showToast('Please upload your ID document', 'info');
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,application/pdf';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const formData = new FormData();
        formData.append('document', file);
        
        try {
            const response = await fetch(`${API_URL}/kyc/submit`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${currentToken}` },
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                showToast('KYC submitted! Awaiting verification.', 'success');
                currentUser.kycStatus = 'pending';
                loadProfile();
            } else {
                showToast('KYC failed: ' + data.error, 'error');
            }
        } catch (error) {
            showToast('Failed to submit KYC', 'error');
        }
    };
    
    input.click();
}

// ========== STATS ==========
async function updateStats() {
    try {
        const response = await fetch(`${API_URL}/investments?phoneNumber=${currentUser?.phoneNumber}`, {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        const data = await response.json();
        
        let totalInvested = 0;
        if (data.success && data.investments) {
            totalInvested = data.investments.reduce((sum, inv) => sum + (inv.status === 'completed' ? inv.amount : 0), 0);
        }
        
        document.getElementById('stat-invested').innerHTML = `KES ${totalInvested.toLocaleString()}`;
        document.getElementById('stat-return').innerHTML = `14%`;
        document.getElementById('stat-co2').innerHTML = (totalInvested / 50000).toFixed(1);
    } catch (error) {
        console.error('Update stats error:', error);
    }
}

// ========== HELPER FUNCTIONS ==========
function getSectorIcon(sector) {
    const icons = {
        'solar': '☀️',
        'e-mobility': '⚡',
        'green-hydrogen': '💧',
        'carbon-credits': '🌿'
    };
    return icons[sector?.toLowerCase()] || '🔋';
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerText = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}