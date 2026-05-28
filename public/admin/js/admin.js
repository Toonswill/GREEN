const API_URL = 'http://localhost:3000/api';
let adminToken = null;

async function adminLogin() {
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success && data.user.role === 'admin') {
            adminToken = data.token;
            localStorage.setItem('adminToken', data.token);
            showToast('Login successful!', 'success');
            loadAdminDashboard();
        } else {
            showToast('Admin access required', 'error');
        }
    } catch (error) {
        showToast('Login failed', 'error');
    }
}

async function loadAdminDashboard() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'block';
    
    await loadAdminStats();
    await loadProjectsForAdmin();
    await loadKYCForAdmin();
    await loadUsersForAdmin();
    await loadInvestmentsForAdmin();
}

async function loadAdminStats() {
    try {
        const response = await fetch(`${API_URL}/admin/stats`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('stat-users').innerText = data.stats.totalUsers;
            document.getElementById('stat-projects').innerText = data.stats.totalProjects;
            document.getElementById('stat-investments').innerText = `KES ${data.stats.totalInvestments.toLocaleString()}`;
            document.getElementById('stat-pending-kyc').innerText = data.stats.pendingKYC;
        }
    } catch (error) {
        console.error('Failed to load stats:', error);
    }
}

async function loadProjectsForAdmin() {
    try {
        const response = await fetch(`${API_URL}/admin/projects`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const data = await response.json();
        
        if (data.success) {
            const tbody = document.getElementById('admin-projects-list');
            if (data.projects.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7">No projects found</td></tr>';
                return;
            }
            
            tbody.innerHTML = data.projects.map(project => `
                <tr>
                    <td>${project.id}</td>
                    <td>${project.title}</td>
                    <td>${project.sector}</td>
                    <td>KES ${project.goalAmount.toLocaleString()}</td>
                    <td>KES ${project.currentAmount.toLocaleString()}</td>
                    <td><span class="badge badge-${project.status === 'active' ? 'verified' : 'pending'}">${project.status}</span></td>
                    <td>
                        ${project.status !== 'active' ? `<button class="btn-approve" onclick="approveProject(${project.id})">Approve</button>` : ''}
                        <button class="btn-reject" onclick="rejectProject(${project.id})">Reject</button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Failed to load projects:', error);
    }
}

async function loadKYCForAdmin() {
    try {
        const response = await fetch(`${API_URL}/kyc/pending`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const data = await response.json();
        
        if (data.success) {
            const tbody = document.getElementById('admin-kyc-list');
            if (data.submissions.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6">No pending KYC submissions</td></tr>';
                return;
            }
            
            tbody.innerHTML = data.submissions.map(sub => `
                <tr>
                    <td>${sub.userId}</td>
                    <td>${sub.name}</td>
                    <td>${sub.email}</td>
                    <td>${sub.phoneNumber}</td>
                    <td><a href="${sub.documentUrl}" target="_blank">View Document</a></td>
                    <td>
                        <button class="btn-approve" onclick="approveKYC(${sub.userId})">Approve</button>
                        <button class="btn-reject" onclick="rejectKYC(${sub.userId})">Reject</button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Failed to load KYC:', error);
    }
}

async function loadUsersForAdmin() {
    try {
        const response = await fetch(`${API_URL}/admin/users`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const data = await response.json();
        
        if (data.success) {
            const tbody = document.getElementById('admin-users-list');
            tbody.innerHTML = data.users.map(user => `
                <tr>
                    <td>${user.id}</td>
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td>${user.phoneNumber}</td>
                    <td>${user.role}</td>
                    <td><span class="badge badge-${user.kycStatus}">${user.kycStatus}</span></td>
                    <td>KES ${user.walletBalance.toLocaleString()}</td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Failed to load users:', error);
    }
}

async function loadInvestmentsForAdmin() {
    try {
        const response = await fetch(`${API_URL}/admin/investments`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const data = await response.json();
        
        if (data.success) {
            const tbody = document.getElementById('admin-investments-list');
            if (data.investments.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6">No investments yet</td></tr>';
                return;
            }
            
            tbody.innerHTML = data.investments.map(inv => `
                <tr>
                    <td>${inv.id}</td>
                    <td>${inv.investorName}</td>
                    <td>${inv.projectTitle}</td>
                    <td>KES ${inv.amount.toLocaleString()}</td>
                    <td><span class="badge badge-${inv.status === 'completed' ? 'verified' : 'pending'}">${inv.status}</span></td>
                    <td>${new Date(inv.createdAt).toLocaleDateString()}</td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Failed to load investments:', error);
    }
}

async function approveProject(projectId) {
    try {
        const response = await fetch(`${API_URL}/admin/projects/${projectId}/approve`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const data = await response.json();
        
        if (data.success) {
            showToast('Project approved!', 'success');
            loadProjectsForAdmin();
        }
    } catch (error) {
        showToast('Failed to approve project', 'error');
    }
}

async function rejectProject(projectId) {
    try {
        const response = await fetch(`${API_URL}/admin/projects/${projectId}/reject`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const data = await response.json();
        
        if (data.success) {
            showToast('Project rejected', 'success');
            loadProjectsForAdmin();
        }
    } catch (error) {
        showToast('Failed to reject project', 'error');
    }
}

async function approveKYC(userId) {
    try {
        const response = await fetch(`${API_URL}/kyc/approve/${userId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const data = await response.json();
        
        if (data.success) {
            showToast('KYC approved!', 'success');
            loadKYCForAdmin();
            loadAdminStats();
        }
    } catch (error) {
        showToast('Failed to approve KYC', 'error');
    }
}

async function rejectKYC(userId) {
    try {
        const response = await fetch(`${API_URL}/kyc/reject/${userId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const data = await response.json();
        
        if (data.success) {
            showToast('KYC rejected', 'success');
            loadKYCForAdmin();
            loadAdminStats();
        }
    } catch (error) {
        showToast('Failed to reject KYC', 'error');
    }
}

function switchAdminTab(tabName) {
    document.querySelectorAll('.admin-tab').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    document.getElementById('admin-projects').style.display = 'none';
    document.getElementById('admin-kyc').style.display = 'none';
    document.getElementById('admin-users').style.display = 'none';
    document.getElementById('admin-investments').style.display = 'none';
    
    document.getElementById(`admin-${tabName}`).style.display = 'block';
}

function adminLogout() {
    localStorage.removeItem('adminToken');
    adminToken = null;
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('admin-dashboard').style.display = 'none';
}

function showToast(message, type) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Check for existing admin session
const savedToken = localStorage.getItem('adminToken');
if (savedToken) {
    adminToken = savedToken;
    loadAdminDashboard();
}