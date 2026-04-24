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
document.addEventListener('DOMContentLoaded', async () => {
    // Check Setup Mode First
    const urlParams = new URLSearchParams(window.location.search);
    const setupToken = urlParams.get('setup_token');
    
    if (setupToken) {
        document.getElementById('login-wrapper').style.display = 'none';
        document.getElementById('setup-wrapper').style.display = 'flex';
        return;
    }
    
    // Check if system is bootstrapped
    try {
        const res = await fetch(`${BASE_URL}/admin/status`);
        const data = await res.json();
        if (data.bootstrapped === false) {
            document.getElementById('login-wrapper').style.display = 'none';
            document.getElementById('bootstrap-wrapper').style.display = 'flex';
            return;
        }
    } catch(e) {}

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
        
        // Use the dedicated admin login endpoint
        const response = await fetch(`${BASE_URL}/admin/login`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Login failed');
        }
        
        const data = await response.json();

        state.token = data.access_token;
        localStorage.setItem('bodhi_admin_token', state.token);
        showDashboard();
    } catch (err) {
        loginError.textContent = err.message;
    }
});

// --- Dashboard Functions ---
function showDashboard() {
    loginContainer.style.display = 'none';
    dashboardContainer.style.display = 'flex';
    
    // Decode JWT to show Admin info
    if (state.token) {
        try {
            const payload = JSON.parse(atob(state.token.split('.')[1]));
            document.getElementById('admin-name').textContent = payload.sub || "Administrator";
        } catch(e) {}
    }
    
    loadOverview();
}

const handleLogout = () => {
    localStorage.removeItem('bodhi_admin_token');
    window.location.reload();
};

logoutBtn.addEventListener('click', handleLogout);

const headerLogoutBtn = document.getElementById('logout-btn-header');
if (headerLogoutBtn) {
    headerLogoutBtn.addEventListener('click', handleLogout);
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
    
    // Hide all views
    document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
    
    // Show target view
    document.getElementById(`view-${targetView}`).style.display = 'block';
    
    // Load data
    if (targetView === 'overview') await loadOverview();
    if (targetView === 'users') await loadUsers();
    if (targetView === 'transactions') await loadTransactions();
    if (targetView === 'notifications') await loadNotifications();
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

// --- Notifications Logic ---
async function loadNotifications() {
    const users = await apiFetch('/admin/users?limit=1000');
    const container = document.getElementById('notif-users-list');
    
    if (!users || users.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); font-size: 13px; padding: 20px;">No users found.</p>';
        return;
    }
    
    container.innerHTML = users.map(u => `
        <label style="display: flex; align-items: center; gap: 12px; padding: 8px 12px; border-bottom: 1px solid rgba(255,255,255,0.05); cursor: pointer; transition: 0.2s;">
            <input type="checkbox" name="user-check" value="${u.id}" class="user-checkbox" style="width: 16px; height: 16px; accent-color: var(--accent-purple);">
            <div>
                <div style="font-size: 14px; font-weight: 600; color: white;">${u.full_name}</div>
                <div style="font-size: 11px; color: var(--text-secondary);">${u.email}</div>
            </div>
        </label>
    `).join('');
    
    // Bind "Select All" functionality
    const selectAllBtn = document.getElementById('notif-select-all');
    const checkboxes = document.querySelectorAll('.user-checkbox');
    
    selectAllBtn.addEventListener('change', (e) => {
        checkboxes.forEach(cb => cb.checked = e.target.checked);
    });
}

const notifForm = document.getElementById('notification-form');
if (notifForm) {
    notifForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('notif-submit-btn');
        const statusSpan = document.getElementById('notif-status');
        
        const title = document.getElementById('notif-title').value;
        const message = document.getElementById('notif-message').value;
        const type = document.getElementById('notif-type').value;
        
        const isSelectAll = document.getElementById('notif-select-all').checked;
        const checks = document.querySelectorAll('.user-checkbox:checked');
        const selectedIds = Array.from(checks).map(cb => cb.value);
        
        if (!isSelectAll && selectedIds.length === 0) {
            statusSpan.textContent = '❌ Please select at least one user.';
            statusSpan.style.color = 'var(--error)';
            return;
        }
        
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.5';
        statusSpan.textContent = 'Sending...';
        statusSpan.style.color = 'var(--text-secondary)';
        
        const payload = {
            title,
            message,
            type,
            send_to_all: isSelectAll,
            user_ids: isSelectAll ? [] : selectedIds
        };
        
        try {
            const res = await apiFetch('/admin/notifications/send', 'POST', payload);
            if (res) {
                statusSpan.textContent = '✅ ' + res.message;
                statusSpan.style.color = 'var(--success)';
                notifForm.reset();
                // keep users loaded
                setTimeout(() => { statusSpan.textContent = ''; }, 4000);
            }
        } catch(error) {
            statusSpan.textContent = '❌ Failed to send.';
            statusSpan.style.color = 'var(--error)';
        } finally {
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
        }
    });
}

// --- Setup Admin Password Logic ---
const setupForm = document.getElementById('setup-form');
if (setupForm) {
    setupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const pwd = document.getElementById('setup-password').value;
        const confirmPwd = document.getElementById('setup-confirm-password').value;
        const secretCode = document.getElementById('setup-secret').value;
        const errorDiv = document.getElementById('setup-error');
        const successDiv = document.getElementById('setup-success');
        
        if (pwd !== confirmPwd) {
            errorDiv.textContent = "Passwords do not match!";
            return;
        }
        if (pwd.length < 8) {
            errorDiv.textContent = "Password must be at least 8 characters.";
            return;
        }
        
        const urlParams = new URLSearchParams(window.location.search);
        const setupToken = urlParams.get('setup_token');
        
        errorDiv.textContent = "";
        
        try {
            const res = await fetch(`${BASE_URL}/admin/setup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: setupToken, password: pwd, secret_code: secretCode })
            });
            
            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data.detail || "Setup failed.");
            }
            
            successDiv.style.display = 'block';
            successDiv.textContent = data.message;
            setupForm.style.display = 'none';
            
            setTimeout(() => {
                window.location.href = window.location.pathname; // strip setup token to show login
            }, 3000);
            
        } catch(err) {
            errorDiv.textContent = err.message;
        }
    });
}

// --- Invite Logic ---
const inviteForm = document.getElementById('invite-form');
if (inviteForm) {
    inviteForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('invite-submit-btn');
        const statusSpan = document.getElementById('invite-status');
        
        const name = document.getElementById('invite-name').value;
        const email = document.getElementById('invite-email').value;
        
        submitBtn.disabled = true;
        statusSpan.textContent = "Generating...";
        
        try {
            const res = await apiFetch('/admin/invite', 'POST', { full_name: name, email: email });
            if (res && res.setup_url) {
                statusSpan.textContent = "✅ Success";
                statusSpan.style.color = "var(--success)";
                
                const linkContainer = document.getElementById('invite-link-container');
                const linkDisplay = document.getElementById('invite-link-display');
                
                // Form a full absolute URL for them to copy
                const fullUrl = window.location.origin + res.setup_url;
                
                linkDisplay.value = fullUrl;
                linkContainer.style.display = 'block';
                
                inviteForm.reset();
            }
        } catch(err) {
            statusSpan.textContent = "❌ Failed to generate";
            statusSpan.style.color = "var(--error)";
        } finally {
            submitBtn.disabled = false;
        }
    });
}
// --- Forgot Password Logic ---
const showForgotPwdBtn = document.getElementById('show-forgot-password');
const backToLoginBtn = document.getElementById('back-to-login');
const forgotForm = document.getElementById('forgot-form');

if (showForgotPwdBtn && backToLoginBtn && forgotForm) {
    showForgotPwdBtn.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('login-wrapper').style.display = 'none';
        document.getElementById('forgot-wrapper').style.display = 'flex';
    });
    
    backToLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('forgot-wrapper').style.display = 'none';
        document.getElementById('login-wrapper').style.display = 'flex';
    });
    
    forgotForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('forgot-email').value;
        const errorDiv = document.getElementById('forgot-error');
        errorDiv.textContent = 'Generating...';
        
        try {
            const res = await fetch(`${BASE_URL}/admin/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            
            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data.detail || "Request failed.");
            }
            
            errorDiv.textContent = '';
            
            if (data.reset_link) {
                const linkContainer = document.getElementById('forgot-success-container');
                const linkDisplay = document.getElementById('forgot-link-display');
                linkDisplay.value = window.location.origin + data.reset_link;
                linkContainer.style.display = 'block';
                forgotForm.reset();
            } else {
                errorDiv.style.color = "var(--success)";
                errorDiv.textContent = data.message;
            }
            
        } catch(err) {
            errorDiv.style.color = "var(--error)";
            errorDiv.textContent = err.message;
        }
    });
}

// --- Bootstrap logic ---
const bootstrapForm = document.getElementById('bootstrap-form');
if (bootstrapForm) {
    bootstrapForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const rawEmails = document.getElementById('bootstrap-emails').value;
        const secretCode = document.getElementById('bootstrap-secret').value;
        const errorDiv = document.getElementById('bootstrap-error');
        const successDiv = document.getElementById('bootstrap-success');
        
        const emailsArray = rawEmails.split(',').map(em => em.trim()).filter(em => em);
        
        errorDiv.textContent = "Bootstrapping System...";
        
        try {
            const res = await fetch(`${BASE_URL}/admin/bootstrap`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emails: emailsArray, secret_code: secretCode })
            });
            
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Bootstrap failed.");
            
            errorDiv.textContent = "";
            successDiv.style.display = "block";
            successDiv.textContent = data.message;
            bootstrapForm.reset();
            
        } catch(err) {
            errorDiv.textContent = err.message;
        }
    });
}
