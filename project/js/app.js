/**
 * DataVault – Secure File Access & Universal Storage Controller
 * Multi-User Logins & Signups, Universal File Uploads (PDF, Excel, Images, etc.),
 * Owner Access Control (Public, Confidential, Specific Users), Live Editor & Downloads.
 */

// Global Application State Cache
const AppState = {
  currentUser: null,       // Logged in session account
  activeOperator: 'admin', // Current active operator context
  users: [],
  files: [],
  permissions: [],
  logs: [],
  alerts: [],
  stats: {
    totalUsers: 0,
    totalFiles: 0,
    totalAttempts: 0,
    allowedAttempts: 0,
    deniedAttempts: 0,
    totalAlerts: 0,
    activeAlerts: 0,
    storageUsage: '0 B'
  },
  activePage: 'dashboard',
  currentEditingFile: null,
  currentUploadingFileBuffer: null, // Base64 data for universal upload
  apiBase: '' // Works identically for localhost and public Cloudflare URLs
};

// ================= INITIALIZATION & LIFECYCLE =================

document.addEventListener('DOMContentLoaded', () => {
  initClock();
  checkAuthSession();
  checkBackendHealth();
  setupHashRouting();
  setupKeyboardShortcuts();
  setupDropZone();
});

function initClock() {
  const clockEl = document.getElementById('clockDisplay');
  const update = () => {
    const now = new Date();
    if (clockEl) {
      clockEl.textContent = now.toLocaleTimeString('en-US', { hour12: false });
    }
  };
  update();
  setInterval(update, 1000);
}

function checkAuthSession() {
  const storedUser = sessionStorage.getItem('datavault_user');
  if (storedUser) {
    try {
      AppState.currentUser = JSON.parse(storedUser);
      AppState.activeOperator = AppState.currentUser.username || 'admin';
      showAppScreen();
    } catch (e) {
      sessionStorage.removeItem('datavault_user');
      showAuthScreen();
    }
  } else {
    showAuthScreen();
  }
}

function setupHashRouting() {
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '') || 'dashboard';
    navigateTo(hash, false);
  });
}

function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop.active').forEach(modal => {
        modal.classList.remove('active');
      });
    }
  });
}

// Drag & Drop Setup for Universal File Upload
function setupDropZone() {
  const dropZone = document.getElementById('fileDropZone');
  if (!dropZone) return;

  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('drag-active');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('drag-active');
    }, false);
  });

  dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0) {
      processSelectedFile(files[0]);
    }
  });
}

// ================= BACKEND API CLIENT =================

async function checkBackendHealth() {
  const statusTag = document.getElementById('backendStatusTag');
  const engineLabel = document.getElementById('systemEngineLabel');
  try {
    const res = await fetch(`${AppState.apiBase}/api/stats`, { method: 'GET' });
    if (res.ok) {
      if (statusTag) {
        statusTag.className = 'badge badge-success';
        statusTag.innerHTML = '<i class="fa-solid fa-check"></i> Server Online';
      }
      if (engineLabel) engineLabel.textContent = 'Cloudflare Live & Protected';
      return true;
    }
  } catch (err) {
    if (statusTag) {
      statusTag.className = 'badge badge-warning';
      statusTag.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Connecting...';
    }
    if (engineLabel) engineLabel.textContent = 'Connecting...';
  }
  return false;
}

async function apiCall(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  if (body && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${AppState.apiBase}${endpoint}`, options);
    const data = await response.json();
    return data;
  } catch (error) {
    console.warn(`API call failed for ${endpoint}:`, error);
    showToast(`Request failed: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

async function loadAllData() {
  try {
    const [usersRes, filesRes, permsRes, logsRes, alertsRes, statsRes] = await Promise.all([
      apiCall('/api/users'),
      apiCall('/api/files'),
      apiCall('/api/permissions'),
      apiCall('/api/logs'),
      apiCall('/api/alerts'),
      apiCall('/api/stats')
    ]);

    if (usersRes && usersRes.users) AppState.users = usersRes.users;
    if (filesRes && filesRes.files) AppState.files = filesRes.files;
    if (permsRes && permsRes.permissions) AppState.permissions = permsRes.permissions;
    if (logsRes && logsRes.logs) AppState.logs = logsRes.logs;
    if (alertsRes && alertsRes.alerts) AppState.alerts = alertsRes.alerts;
    if (statsRes && statsRes.stats) AppState.stats = statsRes.stats;

    updateDashboardMetrics();
    updateNavigationBadges();
    populateOperatorDropdown();
    populateAllowedUsersDropdown();
    renderCurrentPage();
  } catch (err) {
    console.error('Failed to sync data from backend:', err);
    showToast('Failed to sync dataset from storage server', 'error');
  }
}

// ================= AUTHENTICATION & MULTI-USER REGISTRATION =================

function switchAuthTab(tab) {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const tabLogin = document.getElementById('tabBtnLogin');
  const tabRegister = document.getElementById('tabBtnRegister');

  if (tab === 'login') {
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
  } else {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    tabLogin.classList.remove('active');
    tabRegister.classList.add('active');
  }
}

function fillQuickLogin(username, password) {
  const uInput = document.getElementById('usernameInput');
  const pInput = document.getElementById('passwordInput');
  if (uInput) uInput.value = username;
  if (pInput) pInput.value = password;
}

async function handleLogin(event) {
  event.preventDefault();
  const usernameInput = document.getElementById('usernameInput');
  const passwordInput = document.getElementById('passwordInput');
  const loginBtn = document.getElementById('loginBtn');

  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!username || !password) {
    showToast('Please enter both username and password', 'warning');
    return;
  }

  loginBtn.disabled = true;
  loginBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Signing In...';

  const res = await apiCall('/api/login', 'POST', { username, password });
  loginBtn.disabled = false;
  loginBtn.innerHTML = '<span>Sign In to DataVault</span> <i class="fa-solid fa-arrow-right"></i>';

  if (res && res.success) {
    AppState.currentUser = res.user;
    AppState.activeOperator = res.user.username;
    sessionStorage.setItem('datavault_user', JSON.stringify(res.user));
    showToast(`Welcome @${res.user.username}! Signed in successfully.`, 'success');
    showAppScreen();
  } else {
    if (res && res.alertTriggered) {
      showToast(`SECURITY ALERT: 3 consecutive failed login attempts detected for @${username}! An intrusion alert has been raised.`, 'error');
    } else {
      showToast(res.message || 'Invalid username or password', 'error');
    }
  }
}

// Handle Self-Registration for Any New User
async function handleRegister(event) {
  event.preventDefault();
  const username = document.getElementById('regUsername').value.trim();
  const fullname = document.getElementById('regFullname').value.trim();
  const password = document.getElementById('regPassword').value.trim();
  const department = document.getElementById('regDept').value.trim();
  const clearance = document.getElementById('regClearance').value;
  const regBtn = document.getElementById('registerBtn');

  if (!username || !password) {
    showToast('Username and password are required', 'warning');
    return;
  }

  regBtn.disabled = true;
  regBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Creating Account...';

  const res = await apiCall('/api/register', 'POST', {
    username,
    fullname,
    password,
    department,
    clearance,
    role: 'Member'
  });

  regBtn.disabled = false;
  regBtn.innerHTML = '<span>Create Account &amp; Log In</span> <i class="fa-solid fa-user-check"></i>';

  if (res && res.success) {
    AppState.currentUser = res.user;
    AppState.activeOperator = res.user.username;
    sessionStorage.setItem('datavault_user', JSON.stringify(res.user));
    showToast(`Account @${res.user.username} created! You are now logged in.`, 'success');
    showAppScreen();
  } else {
    showToast(res.message || 'Registration failed', 'error');
  }
}

function handleLogout() {
  AppState.currentUser = null;
  sessionStorage.removeItem('datavault_user');
  showToast('Signed out safely.', 'info');
  showAuthScreen();
}

function showAuthScreen() {
  document.getElementById('authScreen').style.display = 'flex';
  document.getElementById('appContainer').style.display = 'none';
}

function showAppScreen() {
  document.getElementById('authScreen').style.display = 'none';
  document.getElementById('appContainer').style.display = 'flex';

  const user = AppState.currentUser || { username: 'admin', fullname: 'Administrator', role: 'SecOps' };
  const avatarEl = document.getElementById('sidebarAvatar');
  const nameEl = document.getElementById('sidebarUserName');
  const roleEl = document.getElementById('sidebarUserRole');

  if (avatarEl) avatarEl.textContent = (user.fullname || user.username || 'A').charAt(0).toUpperCase();
  if (nameEl) nameEl.textContent = user.fullname || user.username;
  if (roleEl) roleEl.textContent = user.role || 'Member';

  loadAllData();
  const initialPage = window.location.hash.replace('#', '') || 'dashboard';
  navigateTo(initialPage, true);
}

function togglePasswordVisibility(inputId) {
  const el = document.getElementById(inputId);
  if (!el) return;
  el.type = el.type === 'password' ? 'text' : 'password';
}

// Switch user context from top navigation bar (for testing permissions easily)
function populateOperatorDropdown() {
  const sel = document.getElementById('activeOperatorSelect');
  if (!sel || AppState.users.length === 0) return;

  const currentVal = AppState.activeOperator || (AppState.currentUser ? AppState.currentUser.username : 'admin');
  sel.innerHTML = AppState.users.map(u => `
    <option value="${escapeHtml(u.username)}" ${u.username === currentVal ? 'selected' : ''}>
      @${escapeHtml(u.username)} (${escapeHtml(u.clearance || 'Member')})
    </option>
  `).join('');
}

function changeActiveOperator() {
  const sel = document.getElementById('activeOperatorSelect');
  if (!sel) return;
  AppState.activeOperator = sel.value;
  showToast(`Operating as: @${AppState.activeOperator}`, 'info');
}

// ================= NAVIGATION & ROUTING =================

function navigateTo(pageId, updateHash = true) {
  const validPages = ['dashboard', 'files', 'permissions', 'users', 'logs', 'alerts'];
  if (!validPages.includes(pageId)) pageId = 'dashboard';

  AppState.activePage = pageId;

  document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
    if (item.getAttribute('data-page') === pageId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  document.querySelectorAll('.view-page').forEach(page => {
    page.classList.remove('active');
  });

  const activeView = document.getElementById(`view-${pageId}`);
  if (activeView) activeView.classList.add('active');

  const titleMap = {
    dashboard: 'Dashboard Overview',
    files: 'File Management & Vault Storage',
    permissions: 'File Access Permissions (ACL)',
    users: 'User Directory',
    logs: 'Access Audit Logs',
    alerts: 'Security & Intrusion Alerts'
  };
  const titleEl = document.getElementById('headerPageTitle');
  if (titleEl) titleEl.textContent = titleMap[pageId] || 'DataVault';

  if (updateHash) {
    window.location.hash = pageId;
  }

  renderCurrentPage();

  const sidebar = document.querySelector('.sidebar');
  if (sidebar && sidebar.classList.contains('mobile-open')) {
    sidebar.classList.remove('mobile-open');
  }
}

function renderCurrentPage() {
  switch (AppState.activePage) {
    case 'dashboard':
      renderDashboard();
      break;
    case 'files':
      renderFilesTable();
      break;
    case 'permissions':
      renderPermissionsTable();
      break;
    case 'users':
      renderUsersTable();
      break;
    case 'logs':
      renderLogsTable();
      break;
    case 'alerts':
      renderAlertsTable();
      break;
  }
}

function refreshCurrentView() {
  loadAllData().then(() => {
    showToast('Vault synchronized with disk storage', 'info');
  });
}

function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) sidebar.classList.toggle('mobile-open');
}

// ================= DASHBOARD VIEW =================

function updateDashboardMetrics() {
  const statUsers = document.getElementById('statTotalUsers');
  const statFiles = document.getElementById('statTotalFiles');
  const statAttempts = document.getElementById('statTotalAttempts');
  const statAttemptsSub = document.getElementById('statAttemptsSubtext');
  const statAlerts = document.getElementById('statTotalAlerts');
  const statAlertsSub = document.getElementById('statAlertsSubtext');
  const statDiskUsage = document.getElementById('statStorageDiskUsage');

  const uCount = AppState.users.length;
  const fCount = AppState.files.length;
  const logCount = AppState.logs.length;
  const allowedCount = AppState.logs.filter(l => l.result === 'ALLOWED').length;
  const deniedCount = AppState.logs.filter(l => l.result === 'DENIED').length;
  const alertCount = AppState.alerts.length;
  const activeAlerts = AppState.alerts.filter(a => a.status === 'ACTIVE').length;

  if (statUsers) statUsers.textContent = uCount;
  if (statFiles) statFiles.textContent = fCount;
  if (statAttempts) statAttempts.textContent = logCount;
  if (statAttemptsSub) statAttemptsSub.innerHTML = `<span class="text-success">${allowedCount} Allowed</span> / <span class="text-danger">${deniedCount} Denied</span>`;
  if (statAlerts) statAlerts.textContent = alertCount;
  if (statAlertsSub) statAlertsSub.textContent = `${activeAlerts} active (3 strikes trigger)`;
  if (statDiskUsage) statDiskUsage.innerHTML = `<i class="fa-solid fa-hard-drive"></i> Real Disk: <strong>${AppState.stats.storageUsage || 'Active'}</strong>`;

  updateNavigationBadges();
}

function updateNavigationBadges() {
  const navLogCount = document.getElementById('navLogCount');
  const navAlertCount = document.getElementById('navAlertCount');
  const navFileCount = document.getElementById('navFileCount');
  const headerAlertDot = document.getElementById('headerAlertDot');

  const activeAlerts = AppState.alerts.filter(a => a.status === 'ACTIVE').length;
  if (navLogCount) navLogCount.textContent = AppState.logs.length;
  if (navFileCount) navFileCount.textContent = AppState.files.length;
  if (navAlertCount) {
    navAlertCount.textContent = activeAlerts;
    navAlertCount.style.display = activeAlerts > 0 ? 'inline-block' : 'none';
  }
  if (headerAlertDot) {
    headerAlertDot.style.display = activeAlerts > 0 ? 'block' : 'none';
  }
}

function renderDashboard() {
  updateDashboardMetrics();

  // Render Recent Logs (last 5)
  const recentLogsBody = document.getElementById('dashboardRecentLogsBody');
  if (recentLogsBody) {
    const recent = AppState.logs.slice().reverse().slice(0, 5);
    if (recent.length === 0) {
      recentLogsBody.innerHTML = '<tr><td colspan="5" class="empty-state">No access records recorded yet.</td></tr>';
    } else {
      recentLogsBody.innerHTML = recent.map(log => {
        const isAllowed = log.result === 'ALLOWED';
        const badgeClass = isAllowed ? 'badge-success' : 'badge-danger';
        const icon = isAllowed ? 'fa-check' : 'fa-xmark';
        return `
          <tr>
            <td class="mono" style="font-size: 11px;">${escapeHtml(log.timestamp || '')}</td>
            <td><strong>@${escapeHtml(log.username)}</strong></td>
            <td class="mono font-semibold">${escapeHtml(log.filename)}</td>
            <td><span class="badge badge-secondary">${escapeHtml(log.action)}</span></td>
            <td><span class="badge ${badgeClass}"><i class="fa-solid ${icon}"></i> ${escapeHtml(log.result)}</span></td>
          </tr>
        `;
      }).join('');
    }
  }

  // Render Recent Alerts (last 3)
  const recentAlertsBody = document.getElementById('dashboardRecentAlertsBody');
  if (recentAlertsBody) {
    const recentAlerts = AppState.alerts.slice().reverse().slice(0, 3);
    if (recentAlerts.length === 0) {
      recentAlertsBody.innerHTML = '<div class="empty-state" style="padding: 24px; text-align: center;">No active security alerts. System secure.</div>';
    } else {
      recentAlertsBody.innerHTML = recentAlerts.map(alert => `
        <div class="alert-stream-item ${alert.status === 'ACTIVE' ? 'active' : ''}">
          <i class="fa-solid fa-triangle-exclamation alert-stream-icon"></i>
          <div class="alert-stream-info">
            <div class="alert-stream-header">
              <span class="alert-stream-title">Repeated Breach: ${escapeHtml(alert.username)} &rarr; ${escapeHtml(alert.filename)}</span>
              <span class="alert-stream-time mono">${escapeHtml(alert.timestamp)}</span>
            </div>
            <div class="alert-stream-desc">
              ${escapeHtml(alert.description || `${alert.failedAttempts} consecutive failed attempts.`)}
            </div>
            <div style="margin-top: 6px;">
              <span class="badge ${alert.status === 'ACTIVE' ? 'badge-danger' : alert.status === 'INVESTIGATING' ? 'badge-warning' : 'badge-success'}">${escapeHtml(alert.status)}</span>
              <span class="badge badge-secondary">Severity: ${escapeHtml(alert.severity || 'HIGH')}</span>
            </div>
          </div>
        </div>
      `).join('');
    }
  }

  // Render Dashboard Files Table
  const dashFilesBody = document.getElementById('dashboardFilesBody');
  if (dashFilesBody) {
    if (AppState.files.length === 0) {
      dashFilesBody.innerHTML = '<tr><td colspan="6" class="empty-state">No files uploaded yet. Click "Upload Any File" to start!</td></tr>';
    } else {
      dashFilesBody.innerHTML = AppState.files.slice(0, 6).map(f => {
        const fileIcon = getFileIcon(f.filename);
        const policyBadge = getPolicyBadge(f.accessPolicy, f.classification, f.allowedUsers);
        return `
          <tr>
            <td>
              <div style="display: flex; align-items: center; gap: 8px;">
                <i class="${fileIcon}" style="font-size: 18px;"></i>
                <div>
                  <div style="font-weight: 700; font-family: var(--font-mono);">${escapeHtml(f.filename)}</div>
                  <div style="font-size: 11px; color: var(--text-muted);">${escapeHtml(f.description || '')}</div>
                </div>
              </div>
            </td>
            <td><strong class="text-primary"><i class="fa-solid fa-user-check"></i> @${escapeHtml(f.owner)}</strong></td>
            <td>${policyBadge}</td>
            <td class="mono" style="font-size: 11px;">${escapeHtml(f.size)}</td>
            <td><code class="mono" style="font-size: 11px; background: #e0f2fe; padding: 2px 6px; border-radius: 4px; color: #0369a1;">${escapeHtml(f.checksum || 'SHA256')}</code></td>
            <td class="text-right">
              <button class="btn btn-sm btn-outline" title="View / Inspect" onclick="openFileEditor('${escapeHtml(f.filename)}')">
                <i class="fa-regular fa-eye"></i> View
              </button>
              <button class="btn btn-sm btn-primary" title="Download Original File" onclick="downloadVaultFile('${escapeHtml(f.filename)}')">
                <i class="fa-solid fa-download"></i>
              </button>
            </td>
          </tr>
        `;
      }).join('');
    }
  }
}

// ================= UNIVERSAL FILE UPLOADS (PDF, EXCEL, IMAGES, DOCS) =================

function openUploadModal() {
  const currentOperator = AppState.activeOperator || (AppState.currentUser ? AppState.currentUser.username : 'admin');
  document.getElementById('uploadOwnerDisplay').value = `@${currentOperator} (You)`;
  document.getElementById('uploadCustomFilename').value = '';
  document.getElementById('uploadDescription').value = '';
  document.getElementById('selectedFilePreview').style.display = 'none';
  document.getElementById('selectedFileName').textContent = '';
  document.getElementById('selectedFileSize').textContent = '';
  AppState.currentUploadingFileBuffer = null;

  // Reset to default Confidential
  const policyRadios = document.getElementsByName('uploadAccessPolicy');
  policyRadios.forEach(r => {
    r.checked = (r.value === 'CONFIDENTIAL');
  });
  togglePolicyFields();

  populateAllowedUsersDropdown();
  openModal('uploadFileModal');
}

function handleFileSelected(event) {
  const file = event.target.files[0];
  if (file) {
    processSelectedFile(file);
  }
}

function processSelectedFile(file) {
  const customNameInput = document.getElementById('uploadCustomFilename');
  const previewDiv = document.getElementById('selectedFilePreview');
  const nameSpan = document.getElementById('selectedFileName');
  const sizeSpan = document.getElementById('selectedFileSize');

  customNameInput.value = file.name;
  nameSpan.textContent = file.name;
  sizeSpan.textContent = formatBytes(file.size);
  previewDiv.style.display = 'inline-flex';

  // Read file into memory as Data URL (Base64)
  const reader = new FileReader();
  reader.onload = function(e) {
    AppState.currentUploadingFileBuffer = e.target.result;
  };
  reader.readAsDataURL(file);
}

function togglePolicyFields() {
  const selectedPolicy = document.querySelector('input[name="uploadAccessPolicy"]:checked')?.value || 'CONFIDENTIAL';
  const clearanceGroup = document.getElementById('policyClearanceGroup');
  const specificUsersGroup = document.getElementById('policySpecificUsersGroup');

  if (clearanceGroup) {
    clearanceGroup.style.display = (selectedPolicy === 'CONFIDENTIAL') ? 'block' : 'none';
  }
  if (specificUsersGroup) {
    specificUsersGroup.style.display = (selectedPolicy === 'SPECIFIC_USERS') ? 'block' : 'none';
  }
}

function populateAllowedUsersDropdown() {
  const sel = document.getElementById('uploadAllowedUsers');
  const mpSel = document.getElementById('mpAllowedUsers');
  const currentOperator = AppState.activeOperator || (AppState.currentUser ? AppState.currentUser.username : 'admin');

  const otherUsers = AppState.users.filter(u => u.username !== currentOperator);
  const optionsHtml = otherUsers.map(u => `
    <option value="${escapeHtml(u.username)}">
      @${escapeHtml(u.username)} (${escapeHtml(u.fullname || u.role)})
    </option>
  `).join('');

  if (sel) sel.innerHTML = optionsHtml;
  if (mpSel) mpSel.innerHTML = optionsHtml;
}

// Handle Form Submission for Universal Upload
async function handleUniversalFileUpload(event) {
  event.preventDefault();

  const filename = document.getElementById('uploadCustomFilename').value.trim();
  const currentOperator = AppState.activeOperator || (AppState.currentUser ? AppState.currentUser.username : 'admin');
  const selectedPolicy = document.querySelector('input[name="uploadAccessPolicy"]:checked')?.value || 'CONFIDENTIAL';
  const classification = document.getElementById('uploadClassification')?.value || 'Confidential';
  const description = document.getElementById('uploadDescription').value.trim();

  // Get allowed users if specific users policy selected
  let allowedUsers = [];
  if (selectedPolicy === 'SPECIFIC_USERS') {
    const sel = document.getElementById('uploadAllowedUsers');
    if (sel) {
      allowedUsers = Array.from(sel.selectedOptions).map(opt => opt.value);
    }
  }

  const submitBtn = document.getElementById('btnSubmitUpload');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Uploading to Disk...';

  const payload = {
    filename: filename,
    fileData: AppState.currentUploadingFileBuffer || null,
    classification: classification,
    accessPolicy: selectedPolicy,
    allowedUsers: allowedUsers,
    owner: currentOperator,
    description: description
  };

  const res = await apiCall('/api/files/upload', 'POST', payload);

  submitBtn.disabled = false;
  submitBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Upload &amp; Secure File';

  if (res && res.success) {
    showToast(`File "${filename}" uploaded! Owner: @${currentOperator}`, 'success');
    closeModal('uploadFileModal');
    await loadAllData();
  } else {
    showToast(res.message || 'File upload failed', 'error');
  }
}

// ================= FILE MANAGEMENT & PREVIEW =================

function renderFilesTable() {
  const tbody = document.getElementById('filesTableBody');
  const countEl = document.getElementById('fileTableCount');
  const search = (document.getElementById('fileSearchInput')?.value || '').toLowerCase().trim();
  const currentOperator = AppState.activeOperator || (AppState.currentUser ? AppState.currentUser.username : 'admin');

  const filtered = AppState.files.filter(f => {
    if (!search) return true;
    return (f.filename && f.filename.toLowerCase().includes(search)) ||
           (f.owner && f.owner.toLowerCase().includes(search)) ||
           (f.accessPolicy && f.accessPolicy.toLowerCase().includes(search)) ||
           (f.classification && f.classification.toLowerCase().includes(search)) ||
           (f.description && f.description.toLowerCase().includes(search));
  });

  if (countEl) countEl.textContent = filtered.length;

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No files match your search. Click "Upload File" to add one!</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(f => {
    const fileIcon = getFileIcon(f.filename);
    const policyBadge = getPolicyBadge(f.accessPolicy, f.classification, f.allowedUsers);
    const isOwner = (f.owner === currentOperator || currentOperator === 'admin');

    return `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 10px;">
            <i class="${fileIcon}" style="font-size: 22px;"></i>
            <div>
              <div style="font-weight: 700; font-family: var(--font-mono);">${escapeHtml(f.filename)}</div>
              <div style="font-size: 11px; color: var(--text-muted);">${escapeHtml(f.description || '')}</div>
            </div>
          </div>
        </td>
        <td>
          <strong class="text-primary"><i class="fa-solid fa-user-check"></i> @${escapeHtml(f.owner)}</strong>
          ${f.owner === currentOperator ? '<span class="badge badge-success" style="font-size: 10px; margin-left: 4px;">You</span>' : ''}
        </td>
        <td>${policyBadge}</td>
        <td class="mono" style="font-size: 12px;">${escapeHtml(f.size)}</td>
        <td><code class="mono" style="font-size: 11px; background: #e0f2fe; padding: 2px 6px; border-radius: 4px; color: #0369a1;">${escapeHtml(f.checksum || 'sha256')}</code></td>
        <td class="mono" style="font-size: 11px;">${escapeHtml(f.updatedAt || 'N/A')}</td>
        <td class="text-right">
          <button class="btn btn-sm btn-outline" title="Open and Read File" onclick="openFileEditor('${escapeHtml(f.filename)}')">
            <i class="fa-regular fa-eye"></i> View
          </button>
          <button class="btn btn-sm btn-primary" title="Download File to Computer" onclick="downloadVaultFile('${escapeHtml(f.filename)}')">
            <i class="fa-solid fa-download"></i>
          </button>
          ${isOwner ? `
            <button class="btn btn-sm btn-outline-secondary" title="Change Access Policy (Owner Only)" onclick="openManagePolicyModal('${escapeHtml(f.id)}')">
              <i class="fa-solid fa-gear"></i> Policy
            </button>
            <button class="btn-action btn-action-danger" title="Delete File (Owner Only)" onclick="deleteFileConfirm('${escapeHtml(f.id)}', '${escapeHtml(f.filename)}')">
              <i class="fa-regular fa-trash-can"></i>
            </button>
          ` : `
            <span class="text-muted" style="font-size: 11px; margin-left: 4px;" title="Only the owner can delete or edit permissions"><i class="fa-solid fa-lock"></i></span>
          `}
        </td>
      </tr>
    `;
  }).join('');
}

// Helpers for Icons and Badges
function getFileIcon(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  if (['pdf'].includes(ext)) return 'fa-solid fa-file-pdf text-danger';
  if (['xlsx', 'xls', 'csv'].includes(ext)) return 'fa-solid fa-file-excel text-success';
  if (['docx', 'doc'].includes(ext)) return 'fa-solid fa-file-word text-primary';
  if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext)) return 'fa-solid fa-file-image text-warning';
  if (['sh', 'js', 'py', 'cpp', 'html', 'css', 'json'].includes(ext)) return 'fa-solid fa-file-code text-info';
  if (['zip', 'tar', 'gz'].includes(ext)) return 'fa-solid fa-file-zipper text-secondary';
  return 'fa-regular fa-file-lines text-primary';
}

function getPolicyBadge(policy, classification, allowedUsers) {
  if (policy === 'PUBLIC') {
    return `<span class="badge badge-success"><i class="fa-solid fa-earth-americas"></i> Public (All)</span>`;
  }
  if (policy === 'SPECIFIC_USERS') {
    const count = Array.isArray(allowedUsers) ? allowedUsers.length : 1;
    return `<span class="badge badge-danger"><i class="fa-solid fa-user-lock"></i> Specific (${count} users)</span>`;
  }
  // Confidential / Clearance based
  let classBadge = 'badge-warning';
  if (classification === 'Top Secret') classBadge = 'badge-danger';
  if (classification === 'Confidential') classBadge = 'badge-info';
  return `<span class="badge ${classBadge}"><i class="fa-solid fa-shield"></i> ${escapeHtml(classification || 'Confidential')}</span>`;
}

// OPEN FILE INSPECTOR / EDITOR
async function openFileEditor(filename) {
  const operator = AppState.activeOperator || (AppState.currentUser ? AppState.currentUser.username : 'admin');
  showToast(`Checking access rights for @${operator} on "${filename}"...`, 'info');

  const res = await apiCall(`/api/vault/read/${encodeURIComponent(filename)}?user=${encodeURIComponent(operator)}`);

  if (!res || !res.success) {
    if (res && res.alertTriggered) {
      showToast(`ACCESS DENIED: 3-strikes reached! Security Alert Triggered!`, 'error');
    } else {
      showToast(`ACCESS DENIED: ${res ? res.message : 'You do not have permission to access this file'}`, 'error');
    }
    await loadAllData();
    return;
  }

  // Access Authorized
  AppState.currentEditingFile = res;

  const titleEl = document.getElementById('editorModalTitle');
  const pathEl = document.getElementById('editorFilePath');
  const classEl = document.getElementById('editorFileClassification');
  const ownerEl = document.getElementById('editorFileOwner');
  const hashEl = document.getElementById('editorFileChecksum');
  const sizeEl = document.getElementById('editorFileSize');
  const contentEl = document.getElementById('editorFileContent');

  if (titleEl) titleEl.innerHTML = `<i class="fa-regular fa-file-lines text-primary"></i> ${escapeHtml(filename)}`;
  if (pathEl) pathEl.textContent = `storage/vault/${filename}`;
  if (classEl) {
    classEl.textContent = res.accessPolicy || res.classification;
    classEl.className = `badge ${res.accessPolicy === 'PUBLIC' ? 'badge-success' : 'badge-warning'}`;
  }
  if (ownerEl) ownerEl.textContent = `@${res.owner}`;
  if (hashEl) hashEl.textContent = res.checksum || '--';
  if (sizeEl) sizeEl.textContent = res.size || '--';
  if (contentEl) contentEl.value = res.content || '';

  openModal('fileEditorModal');
  await loadAllData();
}

// SAVE FILE CONTENT BACK TO DISK
async function saveCurrentFileContent() {
  if (!AppState.currentEditingFile) return;

  const filename = AppState.currentEditingFile.filename;
  const operator = AppState.activeOperator || (AppState.currentUser ? AppState.currentUser.username : 'admin');
  const newContent = document.getElementById('editorFileContent').value;
  const saveBtn = document.getElementById('btnSaveFileContent');

  saveBtn.disabled = true;
  saveBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Saving to Disk...';

  const res = await apiCall(`/api/vault/write/${encodeURIComponent(filename)}`, 'POST', {
    username: operator,
    content: newContent
  });

  saveBtn.disabled = false;
  saveBtn.innerHTML = '<i class="fa-regular fa-floppy-disk"></i> Save Changes to Disk';

  if (res && res.success) {
    showToast(`File "${filename}" updated on disk storage!`, 'success');
    document.getElementById('editorFileChecksum').textContent = res.checksum;
    document.getElementById('editorFileSize').textContent = res.size;
    await loadAllData();
  } else {
    showToast(`WRITE DENIED: ${res ? res.message : 'Missing Write permission'}`, 'error');
    await loadAllData();
  }
}

// DOWNLOAD REAL ORIGINAL FILE
function downloadVaultFile(filename) {
  const operator = AppState.activeOperator || (AppState.currentUser ? AppState.currentUser.username : 'admin');
  const downloadUrl = `${AppState.apiBase}/api/vault/download/${encodeURIComponent(filename)}?user=${encodeURIComponent(operator)}`;

  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  setTimeout(() => loadAllData(), 500);
}

function downloadCurrentFile() {
  if (AppState.currentEditingFile) {
    downloadVaultFile(AppState.currentEditingFile.filename);
  }
}

// MANAGE FILE ACCESS POLICY (OWNER ONLY)
function openManagePolicyModal(fileId) {
  const file = AppState.files.find(f => String(f.id) === String(fileId));
  if (!file) return;

  document.getElementById('mpFileId').value = file.id;
  document.getElementById('managePolicyTitle').textContent = `Manage Policy: ${file.filename}`;
  document.getElementById('mpAccessPolicy').value = file.accessPolicy || 'CONFIDENTIAL';
  document.getElementById('mpClassification').value = file.classification || 'Confidential';
  document.getElementById('mpDescription').value = file.description || '';

  // Select allowed users
  const mpSel = document.getElementById('mpAllowedUsers');
  if (mpSel && Array.isArray(file.allowedUsers)) {
    Array.from(mpSel.options).forEach(opt => {
      opt.selected = file.allowedUsers.includes(opt.value);
    });
  }

  toggleManagePolicyFields();
  openModal('managePolicyModal');
}

function toggleManagePolicyFields() {
  const policy = document.getElementById('mpAccessPolicy').value;
  document.getElementById('mpClearanceGroup').style.display = (policy === 'CONFIDENTIAL') ? 'block' : 'none';
  document.getElementById('mpSpecificUsersGroup').style.display = (policy === 'SPECIFIC_USERS') ? 'block' : 'none';
}

async function saveManagePolicyForm(event) {
  event.preventDefault();
  const fileId = document.getElementById('mpFileId').value;
  const policy = document.getElementById('mpAccessPolicy').value;
  const classification = document.getElementById('mpClassification').value;
  const description = document.getElementById('mpDescription').value.trim();
  const operator = AppState.activeOperator || (AppState.currentUser ? AppState.currentUser.username : 'admin');

  let allowedUsers = [];
  if (policy === 'SPECIFIC_USERS') {
    const sel = document.getElementById('mpAllowedUsers');
    if (sel) {
      allowedUsers = Array.from(sel.selectedOptions).map(opt => opt.value);
    }
  }

  const payload = {
    accessPolicy: policy,
    classification: classification,
    description: description,
    allowedUsers: allowedUsers,
    operator: operator
  };

  const res = await apiCall(`/api/files/${fileId}`, 'PUT', payload);
  if (res && res.success) {
    showToast('File access policy updated successfully', 'success');
    closeModal('managePolicyModal');
    await loadAllData();
  } else {
    showToast(res.message || 'Failed to update policy', 'error');
  }
}

async function deleteFileConfirm(fileId, filename) {
  const operator = AppState.activeOperator || (AppState.currentUser ? AppState.currentUser.username : 'admin');
  if (confirm(`Are you sure you want to delete "${filename}"?`)) {
    const res = await apiCall(`/api/files/${fileId}?operator=${encodeURIComponent(operator)}`, 'DELETE');
    if (res && res.success) {
      showToast(`File "${filename}" deleted`, 'info');
      await loadAllData();
    } else {
      showToast(res.message || 'Failed to delete file', 'error');
    }
  }
}

// ================= PERMISSIONS MANAGEMENT (ACL) VIEW =================

function renderPermissionsTable() {
  const tbody = document.getElementById('permissionsTableBody');
  const countEl = document.getElementById('permissionTableCount');
  const search = (document.getElementById('permissionSearchInput')?.value || '').toLowerCase().trim();

  const filtered = AppState.permissions.filter(p => {
    if (!search) return true;
    return (p.username && p.username.toLowerCase().includes(search)) ||
           (p.filename && p.filename.toLowerCase().includes(search));
  });

  if (countEl) countEl.textContent = filtered.length;

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No specific permission overrides registered.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(p => {
    const canRead = !!p.canRead;
    const canWrite = !!p.canWrite;
    const canExecute = !!p.canExecute;
    const mask = `${canRead ? 'r' : '-'}${canWrite ? 'w' : '-'}${canExecute ? 'x' : '-'}`;

    return `
      <tr>
        <td><strong>@${escapeHtml(p.username)}</strong></td>
        <td class="mono font-semibold">${escapeHtml(p.filename)}</td>
        <td>
          <span class="badge-perm ${canRead ? 'active' : 'inactive'}">
            <i class="fa-solid ${canRead ? 'fa-check' : 'fa-minus'}"></i> READ
          </span>
        </td>
        <td>
          <span class="badge-perm ${canWrite ? 'active' : 'inactive'}">
            <i class="fa-solid ${canWrite ? 'fa-check' : 'fa-minus'}"></i> WRITE
          </span>
        </td>
        <td>
          <span class="badge-perm ${canExecute ? 'active' : 'inactive'}">
            <i class="fa-solid ${canExecute ? 'fa-check' : 'fa-minus'}"></i> EXEC
          </span>
        </td>
        <td><code class="mono" style="font-weight: 700; color: #0284c7; background: #e0f2fe; padding: 2px 6px; border-radius: 4px;">${mask}</code></td>
        <td class="mono" style="font-size: 11px;">${escapeHtml(p.grantedBy || 'admin')}</td>
        <td class="text-right">
          <button class="btn-action" title="Modify Permission" onclick="editPermission('${escapeHtml(p.id)}')">
            <i class="fa-regular fa-pen-to-square"></i>
          </button>
          <button class="btn-action btn-action-danger" title="Revoke Permission" onclick="deletePermissionConfirm('${escapeHtml(p.id)}', '${escapeHtml(p.username)}', '${escapeHtml(p.filename)}')">
            <i class="fa-regular fa-trash-can"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function openCreatePermissionModal() {
  document.getElementById('permissionModalTitle').textContent = 'Grant Specific Access Permission';
  document.getElementById('permFormId').value = '';
  document.getElementById('pFormRead').checked = true;
  document.getElementById('pFormWrite').checked = false;
  document.getElementById('pFormExecute').checked = false;
  document.getElementById('btnSavePermission').textContent = 'Enforce Permission';

  populatePermissionDropdowns();
  openModal('permissionModal');
}

function editPermission(permId) {
  const perm = AppState.permissions.find(p => String(p.id) === String(permId));
  if (!perm) return;

  document.getElementById('permissionModalTitle').textContent = `Edit Permission: @${perm.username} &rarr; ${perm.filename}`;
  document.getElementById('permFormId').value = perm.id;
  document.getElementById('pFormRead').checked = !!perm.canRead;
  document.getElementById('pFormWrite').checked = !!perm.canWrite;
  document.getElementById('pFormExecute').checked = !!perm.canExecute;
  document.getElementById('btnSavePermission').textContent = 'Update Rule';

  populatePermissionDropdowns(perm.username, perm.filename);
  openModal('permissionModal');
}

function populatePermissionDropdowns(selectedUser = '', selectedFile = '') {
  const userSelect = document.getElementById('pFormUser');
  const fileSelect = document.getElementById('pFormFile');

  if (userSelect) {
    userSelect.innerHTML = AppState.users.map(u => `
      <option value="${escapeHtml(u.username)}" ${u.username === selectedUser ? 'selected' : ''}>
        @${escapeHtml(u.username)} (${escapeHtml(u.fullname || u.role)})
      </option>
    `).join('');
  }

  if (fileSelect) {
    fileSelect.innerHTML = AppState.files.map(f => `
      <option value="${escapeHtml(f.filename)}" ${f.filename === selectedFile ? 'selected' : ''}>
        ${escapeHtml(f.filename)} (${escapeHtml(f.classification)})
      </option>
    `).join('');
  }
}

async function savePermissionForm(event) {
  event.preventDefault();
  const id = document.getElementById('permFormId').value;
  const username = document.getElementById('pFormUser').value;
  const filename = document.getElementById('pFormFile').value;
  const canRead = document.getElementById('pFormRead').checked;
  const canWrite = document.getElementById('pFormWrite').checked;
  const canExecute = document.getElementById('pFormExecute').checked;

  const payload = {
    username,
    filename,
    canRead,
    canWrite,
    canExecute,
    grantedBy: AppState.activeOperator || (AppState.currentUser ? AppState.currentUser.username : 'admin')
  };

  let res;
  if (id) {
    payload.id = id;
    res = await apiCall(`/api/permissions/${id}`, 'PUT', payload);
  } else {
    res = await apiCall('/api/permissions', 'POST', payload);
  }

  if (res && res.success) {
    showToast('Permission rule enforced successfully', 'success');
    closeModal('permissionModal');
    await loadAllData();
  } else {
    showToast(res.message || 'Failed to save permission', 'error');
  }
}

async function deletePermissionConfirm(permId, username, filename) {
  if (confirm(`Revoke permission for @${username} on "${filename}"?`)) {
    const res = await apiCall(`/api/permissions/${permId}`, 'DELETE');
    if (res && res.success) {
      showToast('Permission rule revoked', 'info');
      await loadAllData();
    } else {
      showToast(res.message || 'Failed to revoke rule', 'error');
    }
  }
}

// ================= USER DIRECTORY VIEW =================

function renderUsersTable() {
  const tbody = document.getElementById('usersTableBody');
  const countEl = document.getElementById('userTableCount');
  const search = (document.getElementById('userSearchInput')?.value || '').toLowerCase().trim();

  const filtered = AppState.users.filter(u => {
    if (!search) return true;
    return (u.username && u.username.toLowerCase().includes(search)) ||
           (u.fullname && u.fullname.toLowerCase().includes(search)) ||
           (u.role && u.role.toLowerCase().includes(search)) ||
           (u.department && u.department.toLowerCase().includes(search));
  });

  if (countEl) countEl.textContent = filtered.length;

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No users match criteria.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(u => {
    const statusClass = u.status === 'ACTIVE' ? 'badge-success' : 'badge-warning';
    return `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 10px;">
            <div class="avatar" style="width: 32px; height: 32px; font-size: 13px;">${(u.fullname || u.username || 'U').charAt(0).toUpperCase()}</div>
            <div>
              <div style="font-weight: 700; color: #0f172a;">${escapeHtml(u.fullname || u.username)}</div>
              <div class="mono" style="font-size: 11px; color: var(--text-muted);">@${escapeHtml(u.username)}</div>
            </div>
          </div>
        </td>
        <td>${escapeHtml(u.fullname || u.username)}</td>
        <td>${escapeHtml(u.department || 'General')}</td>
        <td><span class="badge badge-secondary">${escapeHtml(u.clearance || 'Confidential')}</span></td>
        <td><span class="badge ${statusClass}">${escapeHtml(u.status || 'ACTIVE')}</span></td>
        <td class="mono" style="font-size: 11px;">${escapeHtml(u.createdAt || 'N/A')}</td>
        <td class="text-right">
          <button class="btn-action" title="Edit User" onclick="editUser('${escapeHtml(u.id)}')">
            <i class="fa-regular fa-pen-to-square"></i>
          </button>
          ${u.username !== 'admin' ? `
            <button class="btn-action btn-action-danger" title="Delete User" onclick="deleteUserConfirm('${escapeHtml(u.id)}', '${escapeHtml(u.username)}')">
              <i class="fa-regular fa-trash-can"></i>
            </button>
          ` : ''}
        </td>
      </tr>
    `;
  }).join('');
}

function openCreateUserModal() {
  document.getElementById('userModalTitle').textContent = 'Add New User';
  document.getElementById('userFormId').value = '';
  document.getElementById('uFormUsername').value = '';
  document.getElementById('uFormUsername').removeAttribute('readonly');
  document.getElementById('uFormFullname').value = '';
  document.getElementById('uFormPassword').value = '123';
  document.getElementById('uFormRole').value = 'Member';
  document.getElementById('uFormDept').value = 'General';
  document.getElementById('uFormClearance').value = 'Confidential';
  document.getElementById('uFormStatus').value = 'ACTIVE';
  document.getElementById('btnSaveUser').textContent = 'Save User';
  openModal('userModal');
}

function editUser(userId) {
  const user = AppState.users.find(u => String(u.id) === String(userId));
  if (!user) return;

  document.getElementById('userModalTitle').textContent = `Edit User: @${user.username}`;
  document.getElementById('userFormId').value = user.id;
  document.getElementById('uFormUsername').value = user.username;
  document.getElementById('uFormUsername').setAttribute('readonly', 'readonly');
  document.getElementById('uFormFullname').value = user.fullname || '';
  document.getElementById('uFormPassword').value = '';
  document.getElementById('uFormRole').value = user.role || 'Member';
  document.getElementById('uFormDept').value = user.department || 'General';
  document.getElementById('uFormClearance').value = user.clearance || 'Confidential';
  document.getElementById('uFormStatus').value = user.status || 'ACTIVE';
  document.getElementById('btnSaveUser').textContent = 'Save Profile';
  openModal('userModal');
}

async function saveUserForm(event) {
  event.preventDefault();
  const id = document.getElementById('userFormId').value;
  const username = document.getElementById('uFormUsername').value.trim();
  const fullname = document.getElementById('uFormFullname').value.trim();
  const password = document.getElementById('uFormPassword').value.trim();
  const role = document.getElementById('uFormRole').value;
  const department = document.getElementById('uFormDept').value.trim();
  const clearance = document.getElementById('uFormClearance').value;
  const status = document.getElementById('uFormStatus').value;

  if (!username) {
    showToast('Username is required', 'warning');
    return;
  }

  const payload = { username, fullname, role, department, clearance, status };
  if (password) payload.password = password;

  let res;
  if (id) {
    payload.id = id;
    res = await apiCall(`/api/users/${id}`, 'PUT', payload);
  } else {
    res = await apiCall('/api/users', 'POST', payload);
  }

  if (res && res.success) {
    showToast(id ? 'User updated successfully' : 'New user added successfully', 'success');
    closeModal('userModal');
    await loadAllData();
  } else {
    showToast(res.message || 'Failed to save user', 'error');
  }
}

async function deleteUserConfirm(userId, username) {
  if (confirm(`Delete user "@${username}"?`)) {
    const res = await apiCall(`/api/users/${userId}`, 'DELETE');
    if (res && res.success) {
      showToast(`User @${username} deleted`, 'info');
      await loadAllData();
    } else {
      showToast(res.message || 'Failed to delete user', 'error');
    }
  }
}

// ================= ACCESS AUDIT LOGS VIEW =================

function renderLogsTable() {
  const tbody = document.getElementById('logsTableBody');
  const search = (document.getElementById('logsSearchInput')?.value || '').toLowerCase().trim();
  const filterResult = document.getElementById('logFilterResult')?.value || 'ALL';
  const filterAction = document.getElementById('logFilterAction')?.value || 'ALL';
  const paginationInfo = document.getElementById('logsPaginationInfo');

  let filtered = AppState.logs.slice().reverse().filter(log => {
    if (filterResult !== 'ALL' && log.result !== filterResult) return false;
    if (filterAction !== 'ALL' && log.action !== filterAction) return false;
    if (search) {
      const match = (log.username && log.username.toLowerCase().includes(search)) ||
                    (log.filename && log.filename.toLowerCase().includes(search)) ||
                    (log.timestamp && log.timestamp.toLowerCase().includes(search)) ||
                    (log.clientIp && log.clientIp.toLowerCase().includes(search)) ||
                    (log.reason && log.reason.toLowerCase().includes(search));
      if (!match) return false;
    }
    return true;
  });

  if (paginationInfo) {
    paginationInfo.textContent = `Showing ${filtered.length} of ${AppState.logs.length} audit records`;
  }

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No access audit records found.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(log => {
    const isAllowed = log.result === 'ALLOWED';
    const badgeClass = isAllowed ? 'badge-success' : 'badge-danger';
    const icon = isAllowed ? 'fa-check' : 'fa-xmark';

    return `
      <tr>
        <td class="mono" style="font-size: 11px; color: var(--text-muted); font-weight: 600;">#${escapeHtml(log.id || '')}</td>
        <td class="mono" style="font-size: 11px; white-space: nowrap;">${escapeHtml(log.timestamp || '')}</td>
        <td><strong>@${escapeHtml(log.username)}</strong></td>
        <td class="mono font-semibold">${escapeHtml(log.filename)}</td>
        <td><span class="badge badge-secondary">${escapeHtml(log.action)}</span></td>
        <td><span class="badge ${badgeClass}"><i class="fa-solid ${icon}"></i> ${escapeHtml(log.result)}</span></td>
        <td class="mono" style="font-size: 11px;">${escapeHtml(log.clientIp || '127.0.0.1')}</td>
        <td style="font-size: 12px; color: var(--text-muted); max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(log.reason || '')}">
          ${escapeHtml(log.reason || '')}
        </td>
      </tr>
    `;
  }).join('');
}

function exportLogsCsv() {
  if (AppState.logs.length === 0) {
    showToast('No log records available to export', 'warning');
    return;
  }

  const headers = ['Log ID', 'Timestamp', 'Username', 'Filename', 'Action', 'Result', 'Client IP', 'Reason'];
  const rows = AppState.logs.map(l => [
    `"${l.id || ''}"`,
    `"${l.timestamp || ''}"`,
    `"${l.username || ''}"`,
    `"${l.filename || ''}"`,
    `"${l.action || ''}"`,
    `"${l.result || ''}"`,
    `"${l.clientIp || ''}"`,
    `"${(l.reason || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `datavault_audit_logs_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast('Access logs exported as CSV', 'success');
}

async function clearLogsConfirm() {
  if (confirm('Clear all access audit logs?')) {
    const res = await apiCall('/api/logs/clear', 'POST');
    if (res && res.success) {
      showToast('Audit logs cleared', 'info');
      await loadAllData();
    } else {
      showToast(res.message || 'Failed to clear logs', 'error');
    }
  }
}

// ================= SECURITY ALERTS VIEW =================

function renderAlertsTable() {
  const tbody = document.getElementById('alertsTableBody');
  const search = (document.getElementById('alertsSearchInput')?.value || '').toLowerCase().trim();
  const filterStatus = document.getElementById('alertFilterStatus')?.value || 'ALL';

  const countTotal = document.getElementById('alertCountTotal');
  const countActive = document.getElementById('alertCountActive');
  const countInvestigating = document.getElementById('alertCountInvestigating');
  const countResolved = document.getElementById('alertCountResolved');

  const total = AppState.alerts.length;
  const active = AppState.alerts.filter(a => a.status === 'ACTIVE').length;
  const investigating = AppState.alerts.filter(a => a.status === 'INVESTIGATING').length;
  const resolved = AppState.alerts.filter(a => a.status === 'RESOLVED').length;

  if (countTotal) countTotal.textContent = total;
  if (countActive) countActive.textContent = active;
  if (countInvestigating) countInvestigating.textContent = investigating;
  if (countResolved) countResolved.textContent = resolved;

  let filtered = AppState.alerts.slice().reverse().filter(a => {
    if (filterStatus !== 'ALL' && a.status !== filterStatus) return false;
    if (search) {
      const match = (a.username && a.username.toLowerCase().includes(search)) ||
                    (a.filename && a.filename.toLowerCase().includes(search)) ||
                    (a.status && a.status.toLowerCase().includes(search)) ||
                    (a.description && a.description.toLowerCase().includes(search));
      if (!match) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" class="empty-state">No security incidents detected. System secure.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(a => {
    let statusBadge = 'badge-danger';
    if (a.status === 'INVESTIGATING') statusBadge = 'badge-warning';
    else if (a.status === 'RESOLVED') statusBadge = 'badge-success';

    let sevBadge = 'badge-danger';
    if (a.severity === 'MEDIUM') sevBadge = 'badge-warning';
    else if (a.severity === 'LOW') sevBadge = 'badge-info';

    return `
      <tr>
        <td class="mono font-semibold" style="font-size: 11px;">#${escapeHtml(a.id || '')}</td>
        <td class="mono" style="font-size: 11px; white-space: nowrap;">${escapeHtml(a.timestamp || '')}</td>
        <td><strong>@${escapeHtml(a.username)}</strong></td>
        <td class="mono font-semibold">${escapeHtml(a.filename)}</td>
        <td class="text-danger font-semibold"><i class="fa-solid fa-triangle-exclamation"></i> ${a.failedAttempts || 3}</td>
        <td><span class="badge ${sevBadge}">${escapeHtml(a.severity || 'HIGH')}</span></td>
        <td><span class="badge ${statusBadge}">${escapeHtml(a.status || 'ACTIVE')}</span></td>
        <td style="font-size: 12px; color: var(--text-muted); max-width: 250px;">${escapeHtml(a.description || 'Threshold exceeded')}</td>
        <td class="text-right">
          <button class="btn btn-sm btn-outline" onclick="openAlertStatusModal('${escapeHtml(a.id)}')">
            <i class="fa-solid fa-shield"></i> Update
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function openAlertStatusModal(alertId) {
  const alert = AppState.alerts.find(a => String(a.id) === String(alertId));
  if (!alert) return;

  document.getElementById('aFormId').value = alert.id;
  document.getElementById('aFormStatus').value = alert.status || 'ACTIVE';
  document.getElementById('aFormNotes').value = alert.notes || '';

  const summary = document.getElementById('aFormSummary');
  if (summary) {
    summary.innerHTML = `
      <div style="font-weight: 700; color: #991b1b; margin-bottom: 4px;">Incident #${escapeHtml(alert.id)} - Repeated Unauthorized Access</div>
      <div style="color: #475569; font-size: 12px;">
        User: <strong>@${escapeHtml(alert.username)}</strong> &bull;
        File: <strong>${escapeHtml(alert.filename)}</strong> &bull;
        Violations: <strong class="text-danger">${alert.failedAttempts} consecutive strikes</strong>
      </div>
    `;
  }

  openModal('alertModal');
}

async function saveAlertStatusForm(event) {
  event.preventDefault();
  const id = document.getElementById('aFormId').value;
  const status = document.getElementById('aFormStatus').value;
  const notes = document.getElementById('aFormNotes').value.trim();

  const res = await apiCall(`/api/alerts/${id}/status`, 'PUT', { status, notes });
  if (res && res.success) {
    showToast(`Incident status updated to ${status}`, 'success');
    closeModal('alertModal');
    await loadAllData();
  } else {
    showToast(res.message || 'Failed to update alert', 'error');
  }
}

async function clearAlertsConfirm() {
  if (confirm('Clear all security alerts and reset strike counters?')) {
    const res = await apiCall('/api/alerts/clear', 'POST');
    if (res && res.success) {
      showToast('All security alerts cleared', 'info');
      await loadAllData();
    } else {
      showToast(res.message || 'Failed to clear alerts', 'error');
    }
  }
}

// ================= MODAL & TOAST HELPERS =================

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('active');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let icon = 'fa-circle-info';
  if (type === 'success') icon = 'fa-circle-check';
  else if (type === 'error') icon = 'fa-triangle-exclamation';
  else if (type === 'warning') icon = 'fa-circle-exclamation';

  toast.innerHTML = `
    <i class="fa-solid ${icon}"></i>
    <span>${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(30px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function escapeHtml(str) {
  if (str === undefined || str === null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
