// API URL (change to your actual IP/domain when deploying)
const API_URL = 'http://localhost:3000/api';

// Current selected project
let selectedProject = null;

// Load projects on page load
document.addEventListener('DOMContentLoaded', () => {
    loadProjects();
});

// Fetch and display projects
async function loadProjects() {
    const container = document.getElementById('projects-container');
    container.innerHTML = '<div class="loading">📡 Loading climate projects...</div>';
    
    try {
        const response = await fetch(`${API_URL}/projects`);
        const data = await response.json();
        
        if (data.success && data.projects.length > 0) {
            displayProjects(data.projects);
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    🌱 No projects yet.<br>
                    Be the first to invest!
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading projects:', error);
        container.innerHTML = `
            <div class="empty-state">
                ⚠️ Could not connect to server.<br>
                Make sure the backend is running.
            </div>
        `;
    }
}

// Display projects in the grid
function displayProjects(projects) {
    const container = document.getElementById('projects-container');
    container.innerHTML = projects.map(project => `
        <div class="project-card" onclick="openInvestmentModal(${JSON.stringify(project).replace(/"/g, '&quot;')})">
            <span class="project-sector">${getSectorEmoji(project.sector)} ${project.sector}</span>
            <div class="project-title">${project.title}</div>
            <div class="project-description">${project.description.substring(0, 80)}${project.description.length > 80 ? '...' : ''}</div>
            <div class="progress-bar-container">
                <div class="progress-bar" style="width: ${(project.currentAmount / project.goalAmount) * 100}%"></div>
            </div>
            <div class="project-stats">
                <div class="stat">
                    <div class="stat-value">KES ${formatNumber(project.currentAmount)}</div>
                    <div class="stat-label">Raised</div>
                </div>
                <div class="stat">
                    <div class="stat-value">KES ${formatNumber(project.goalAmount)}</div>
                    <div class="stat-label">Goal</div>
                </div>
                <div class="stat">
                    <div class="return-badge">${project.expectedReturnPercent}% ROI</div>
                </div>
            </div>
        </div>
    `).join('');
}

// Open investment modal
function openInvestmentModal(project) {
    selectedProject = project;
    document.getElementById('modal-project-title').innerText = project.title;
    document.getElementById('investment-modal').style.display = 'flex';
    document.getElementById('payment-status').innerHTML = '';
    document.getElementById('investment-form').reset();
}

// Close modal
function closeModal() {
    document.getElementById('investment-modal').style.display = 'none';
    selectedProject = null;
}

// Handle investment form submission
document.getElementById('investment-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!selectedProject) return;
    
    const amount = document.getElementById('investment-amount').value;
    const investorName = document.getElementById('investor-name').value;
    let phoneNumber = document.getElementById('investor-phone').value;
    const investorEmail = document.getElementById('investor-email').value;
    
    // Format phone number
    phoneNumber = phoneNumber.replace(/\D/g, '');
    if (phoneNumber.startsWith('0')) {
        phoneNumber = '254' + phoneNumber.substring(1);
    } else if (phoneNumber.startsWith('254')) {
        // Already correct
    } else {
        phoneNumber = '254' + phoneNumber;
    }
    
    // Validation
    if (amount < 10) {
        showPaymentStatus('Minimum investment is KES 10', 'error');
        return;
    }
    
    if (amount > 100000) {
        showPaymentStatus('Maximum investment is KES 100,000 (CMA regulation)', 'error');
        return;
    }
    
    showPaymentStatus('Processing... 📱 Check your phone for M-Pesa prompt', 'info');
    
    try {
        const response = await fetch(`${API_URL}/investments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                phoneNumber: phoneNumber,
                amount: parseInt(amount),
                projectId: selectedProject.id,
                investorName: investorName,
                investorEmail: investorEmail
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showPaymentStatus(`✅ ${data.message}`, 'success');
            setTimeout(() => {
                closeModal();
                loadProjects(); // Refresh to show updated progress
            }, 3000);
        } else {
            showPaymentStatus(`❌ ${data.error}`, 'error');
        }
    } catch (error) {
        console.error('Investment error:', error);
        showPaymentStatus('❌ Network error. Please try again.', 'error');
    }
});

// Show status message in modal
function showPaymentStatus(message, type) {
    const statusDiv = document.getElementById('payment-status');
    statusDiv.innerHTML = message;
    statusDiv.style.background = type === 'error' ? '#ffebee' : (type === 'success' ? '#e8f5e9' : '#e3f2fd');
    statusDiv.style.color = type === 'error' ? '#c62828' : (type === 'success' ? '#2e7d32' : '#1565c0');
}

// Tab navigation
function showProjectsTab() {
    document.getElementById('tab-projects').classList.add('active');
    document.getElementById('tab-portfolio').classList.remove('active');
    document.getElementById('projects-container').style.display = 'flex';
    document.getElementById('portfolio-container')?.remove();
    document.getElementById('projects-container').innerHTML = '<div class="loading">Loading projects...</div>';
    loadProjects();
}

async function showPortfolioTab() {
    document.getElementById('tab-portfolio').classList.add('active');
    document.getElementById('tab-projects').classList.remove('active');
    
    // Hide projects container, show portfolio
    const projectsContainer = document.getElementById('projects-container');
    projectsContainer.style.display = 'none';
    
    // Create or update portfolio container
    let portfolioContainer = document.getElementById('portfolio-container');
    if (!portfolioContainer) {
        portfolioContainer = document.createElement('div');
        portfolioContainer.id = 'portfolio-container';
        portfolioContainer.className = 'portfolio-container';
        projectsContainer.parentNode.appendChild(portfolioContainer);
    }
    
    portfolioContainer.innerHTML = '<div class="loading">📊 Loading your investments...</div>';
    portfolioContainer.style.display = 'block';
    
    // For now, prompt user to enter phone number (simplified)
    const phoneNumber = prompt('Enter your M-Pesa phone number to view your investments:', '0712345678');
    if (!phoneNumber) {
        portfolioContainer.innerHTML = '<div class="empty-state">Enter a phone number to view your portfolio</div>';
        return;
    }
    
    let formattedPhone = phoneNumber.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
        formattedPhone = '254' + formattedPhone.substring(1);
    }
    
    try {
        const response = await fetch(`${API_URL}/investments?phoneNumber=${formattedPhone}`);
        const data = await response.json();
        
        if (data.success && data.investments.length > 0) {
            portfolioContainer.innerHTML = `
                <div style="margin-bottom: 16px; font-size: 14px; color: #6b7a8a;">
                    📱 Showing investments for ${formattedPhone}
                </div>
                ${data.investments.map(inv => `
                    <div class="investment-item">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <strong>${inv.projectTitle}</strong>
                            <span class="return-badge">${inv.status === 'completed' ? '✅ Confirmed' : '⏳ Pending'}</span>
                        </div>
                        <div>Amount: <strong>KES ${formatNumber(inv.amount)}</strong></div>
                        <div style="font-size: 12px; color: #6b7a8a; margin-top: 4px;">
                            ${new Date(inv.createdAt).toLocaleDateString()}
                        </div>
                    </div>
                `).join('')}
            `;
        } else {
            portfolioContainer.innerHTML = '<div class="empty-state">💼 No investments found for this number</div>';
        }
    } catch (error) {
        portfolioContainer.innerHTML = '<div class="empty-state">⚠️ Could not load portfolio. Make sure server is running.</div>';
    }
}

// Helper functions
function getSectorEmoji(sector) {
    const emojis = {
        'e-mobility': '⚡',
        'green-hydrogen': '💧',
        'carbon-credits': '🌿',
        'solar': '☀️'
    };
    return emojis[sector.toLowerCase()] || '🔋';
}

function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}