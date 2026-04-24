/**
 * app.js
 * Admin Dashboard Logic for BODHI
 */

const BASE_URL = 'http://bodhi-env.eba-at8qpmww.ap-south-1.elasticbeanstalk.com';

const state = {
    token: localStorage.getItem('bodhi_admin_token'),
    currentView: 'overview',
};

// --- Selectors ---
const loginContainer = document.getElementById('login-container');
const dashboardContainer = document.getElementById('dashboard-container');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');
const navItems = document.querySelectorAll('.nav-item');
const views = document.querySelectorAll('.view');
const viewTitle = document.getElementById('view-title');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    if (state.token) {
        showDashboard();
    }
});

// --- Auth logic ---
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    loginError.textContent = '';
    
    try {
        const formData = new FormData();
        formData.append('username', email); // FastAPI OAuth2 standard
        formData.append('password', password);
        
        const response = await fetch(`${BASE_URL}/auth/token`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Login failed');
        }
        
        const data = await response.json();
        
        // We need to check if this user is actually an admin
        // Let's fetch their profile first
        const profileRes = await fetch(`${BASE_URL}/users/me`, {
            headers: { 'Authorization': `Bearer ${data.access_token}` }
        });
        const profile = await profileRes.json();
        
        if (!profile.is_admin) {
            throw new Error('Access Denied: You do not have administrator privileges.');
        }

        state.token = data.access_token;
        localStorage.setItem('bodhi_admin_token', state.token);
        showDashboard();
    } catch (err) {
        loginError.textContent = err.message;
    }
});

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('bodhi_admin_token');
    window.location.reload();
});

// --- Dashboard Functions ---
function showDashboard() {
    loginContainer.style.display = 'none';
    dashboardContainer.style.display = 'flex';
    loadOverview();
}

async function apiFetch(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Authorization': `Bearer ${state.token}`,
            'Content-Type': 'application/json'
        }
    };
    if (body) options.body = JSON.stringify(body);
    
    const res = await fetch(`${BASE_URL}${endpoint}`, options);
    if (res.status === 401 || res.status === 403) {
        logoutBtn.click();
        return null;
    }
    return res.json();
}

// --- Navigation ---
navItems.forEach(item => {
    item.addEventListener('click', () => {
        if (item.classList.contains('logout-btn')) return;
        
        const view = item.getAttribute('data-view');
        switchView(view);
    });
});

async function switchView(targetView) {
    state.currentView = targetView;
    
    // Update Nav
    navItems.forEach(i => i.classList.remove('active'));
    document.querySelector(`[data-view="${targetView}"]`).classList.add('active');
    
    // Update Title
    viewTitle.textContent = targetView.charAt(0).toUpperCase() + targetView.slice(1);
    
    // Show/Hide sections
    views.forEach(v => v.style.display = 'none');
    document.getElementById(`view-${targetView}`).style.display = 'block';
    
    // Load data
    if (targetView === 'overview') await loadOverview();
    if (targetView === 'users') await loadUsers();
    if (targetView === 'transactions') await loadTransactions();
}

// --- Data Loading ---
async function loadOverview() {
    const stats = await apiFetch('/admin/stats');
    if (!stats) return;
    
    document.getElementById('stat-total-users').textContent = stats.total_users;
    document.getElementById('stat-total-balance').textContent = `₹${parseFloat(stats.total_balance_pool).toLocaleString('en-IN')}`;
    document.getElementById('stat-total-txns').textContent = stats.total_transactions;
    
    // Load some recent user logs (simulated for now by user list)
    const users = await apiFetch('/admin/users?limit=5');
    const tbody = document.querySelector('#recent-logs tbody');
    tbody.innerHTML = users.map(u => `
        <tr>
            <td>New Registration</td>
            <td>${u.full_name}</td>
            <td><span class="status-badge active">Done</span></td>
            <td>${new Date(u.created_at).toLocaleDateString()}</td>
        </tr>
    `).join('');
}

async function loadUsers() {
    const users = await apiFetch('/admin/users');
    const tbody = document.querySelector('#users-table tbody');
    tbody.innerHTML = users.map(u => `
        <tr>
            <td>${u.full_name}</td>
            <td>${u.email}</td>
            <td>₹${u.balance.toLocaleString('en-IN')}</td>
            <td><span class="status-badge ${u.is_active ? 'active' : 'inactive'}">${u.is_active ? 'Active' : 'Blocked'}</span></td>
            <td>
                <button class="action-btn" onclick="toggleUser('${u.id}')">${u.is_active ? 'Block' : 'Unblock'}</button>
            </td>
        </tr>
    `).join('');
}

async function loadTransactions() {
    const txs = await apiFetch('/admin/transactions');
    const tbody = document.querySelector('#tx-table tbody');
    tbody.innerHTML = txs.map(t => `
        <tr>
            <td>${t.id.slice(0,8)}...</td>
            <td>${t.user_id.slice(0,8)}...</td>
            <td style="color: ${t.entry_type === 'DEBIT' ? '#ff3b30' : '#34c759'}">
                ${t.entry_type === 'DEBIT' ? '-' : '+'}₹${t.amount.toLocaleString('en-IN')}
            </td>
            <td>${t.entry_type}</td>
            <td><span class="status-badge active">${t.status}</span></td>
            <td>${new Date(t.created_at).toLocaleDateString()}</td>
        </tr>
    `).join('');
}

// Global functions for inline attributes
window.toggleUser = async (userId) => {
    const res = await apiFetch(`/admin/users/${userId}/toggle-active`, 'POST');
    if (res) loadUsers();
};
