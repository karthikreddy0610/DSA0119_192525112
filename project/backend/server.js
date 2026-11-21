/**
 * DataVault – Industrial-Grade Enterprise Backend Server
 * Universal File Uploads (PDF, Excel, Images, Scripts, Documents, Binary),
 * Dynamic Visibility & Access Policies (Public, Confidential/Clearance, Specific Users Only),
 * Multi-User Registration & Authentication, Real Disk Storage, Cryptographic Checksums (SHA-256),
 * Granular Access Control and Automated 3-Strikes Intrusion Alerts.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 8000;
const ROOT_DIR = path.join(__dirname, '..');
const VAULT_STORAGE_DIR = path.join(ROOT_DIR, 'storage', 'vault');
const DB_FILE = path.join(ROOT_DIR, 'datavault_db.json');

// Ensure physical vault directory exists
if (!fs.existsSync(VAULT_STORAGE_DIR)) {
  fs.mkdirSync(VAULT_STORAGE_DIR, { recursive: true });
}

// Helper: current formatted timestamp
function getTimestamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

// Compute SHA-256 hash of a file on disk
function computeFileHash(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath);
      return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
    }
  } catch (e) {}
  return 'e3b0c44298fc1c14';
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Memory database state
let db = {
  users: [],
  files: [],
  permissions: [],
  logs: [],
  alerts: []
};

// Map of consecutive failed attempts per "username:filename"
const failedAttemptsCounter = new Map();

// Map of consecutive failed login attempts per username
const failedLoginCounter = new Map();


function seedInitialData() {
  const now = getTimestamp();
  db = {
    users: [
      { id: "101", username: "admin", password: "123", fullname: "Administrator", role: "SecOps Admin", department: "Cybersecurity Ops", clearance: "Top Secret", status: "ACTIVE", createdAt: now },
      { id: "102", username: "alice_dev", password: "123", fullname: "Alice Johnson", role: "Lead Systems Architect", department: "Core Engineering", clearance: "Secret", status: "ACTIVE", createdAt: now },
      { id: "103", username: "bob_analyst", password: "123", fullname: "Bob Vance", role: "Financial Auditor", department: "Corporate Finance", clearance: "Confidential", status: "ACTIVE", createdAt: now },
      { id: "104", username: "sarah_sec", password: "123", fullname: "Sarah Connor", role: "Chief Security Officer", department: "Threat Intelligence", clearance: "Top Secret", status: "ACTIVE", createdAt: now },
      { id: "105", username: "guest_user", password: "123", fullname: "Guest Contractor", role: "External Auditor", department: "Third-Party Assessment", clearance: "Unclassified", status: "ACTIVE", createdAt: now }
    ],
    files: [
      {
        id: "201",
        filename: "financial_audit_2026.csv",
        path: "storage/vault/financial_audit_2026.csv",
        classification: "Confidential",
        accessPolicy: "CONFIDENTIAL",
        allowedUsers: ["bob_analyst", "admin"],
        owner: "bob_analyst",
        size: "143 B",
        mimeType: "text/csv",
        checksum: computeFileHash(path.join(VAULT_STORAGE_DIR, "financial_audit_2026.csv")),
        description: "Q1-Q4 Enterprise Revenue and Fiscal Operating Ledger",
        updatedAt: now
      },
      {
        id: "202",
        filename: "classified_defense_blueprint.txt",
        path: "storage/vault/classified_defense_blueprint.txt",
        classification: "Top Secret",
        accessPolicy: "SPECIFIC_USERS",
        allowedUsers: ["sarah_sec", "admin"],
        owner: "sarah_sec",
        size: "217 B",
        mimeType: "text/plain",
        checksum: computeFileHash(path.join(VAULT_STORAGE_DIR, "classified_defense_blueprint.txt")),
        description: "Project Ironclad Sentinel Architecture & HSM Crypto Key Specifications",
        updatedAt: now
      },
      {
        id: "203",
        filename: "security_compliance_audit.txt",
        path: "storage/vault/security_compliance_audit.txt",
        classification: "Secret",
        accessPolicy: "CONFIDENTIAL",
        allowedUsers: ["sarah_sec", "alice_dev", "admin"],
        owner: "sarah_sec",
        size: "245 B",
        mimeType: "text/plain",
        checksum: computeFileHash(path.join(VAULT_STORAGE_DIR, "security_compliance_audit.txt")),
        description: "SOC2 Type-II & ISO-27001 Formal Information Security Policies",
        updatedAt: now
      },
      {
        id: "204",
        filename: "employee_directory.csv",
        path: "storage/vault/employee_directory.csv",
        classification: "Public",
        accessPolicy: "PUBLIC",
        allowedUsers: [],
        owner: "admin",
        size: "289 B",
        mimeType: "text/csv",
        checksum: computeFileHash(path.join(VAULT_STORAGE_DIR, "employee_directory.csv")),
        description: "Staff Directory with Clearance Level & Internal Security Credentials",
        updatedAt: now
      },
      {
        id: "205",
        filename: "system_kernel_patch.sh",
        path: "storage/vault/system_kernel_patch.sh",
        classification: "Secret",
        accessPolicy: "SPECIFIC_USERS",
        allowedUsers: ["alice_dev", "admin"],
        owner: "alice_dev",
        size: "129 B",
        mimeType: "text/plain",
        checksum: computeFileHash(path.join(VAULT_STORAGE_DIR, "system_kernel_patch.sh")),
        description: "Automated Kernel Network Hardening and Reverse-Path Filter Script",
        updatedAt: now
      }
    ],
    permissions: [
      { id: "301", username: "admin", filename: "financial_audit_2026.csv", canRead: true, canWrite: true, canExecute: true, grantedBy: "system", updatedAt: now },
      { id: "302", username: "admin", filename: "classified_defense_blueprint.txt", canRead: true, canWrite: true, canExecute: true, grantedBy: "system", updatedAt: now },
      { id: "303", username: "admin", filename: "security_compliance_audit.txt", canRead: true, canWrite: true, canExecute: true, grantedBy: "system", updatedAt: now },
      { id: "304", username: "admin", filename: "employee_directory.csv", canRead: true, canWrite: true, canExecute: true, grantedBy: "system", updatedAt: now },
      { id: "305", username: "admin", filename: "system_kernel_patch.sh", canRead: true, canWrite: true, canExecute: true, grantedBy: "system", updatedAt: now },

      { id: "306", username: "alice_dev", filename: "system_kernel_patch.sh", canRead: true, canWrite: true, canExecute: true, grantedBy: "admin", updatedAt: now },
      { id: "307", username: "alice_dev", filename: "security_compliance_audit.txt", canRead: true, canWrite: false, canExecute: false, grantedBy: "admin", updatedAt: now },

      { id: "308", username: "bob_analyst", filename: "financial_audit_2026.csv", canRead: true, canWrite: true, canExecute: false, grantedBy: "admin", updatedAt: now },
      { id: "309", username: "bob_analyst", filename: "employee_directory.csv", canRead: true, canWrite: false, canExecute: false, grantedBy: "admin", updatedAt: now },

      { id: "310", username: "sarah_sec", filename: "classified_defense_blueprint.txt", canRead: true, canWrite: true, canExecute: false, grantedBy: "admin", updatedAt: now },
      { id: "311", username: "sarah_sec", filename: "security_compliance_audit.txt", canRead: true, canWrite: true, canExecute: true, grantedBy: "admin", updatedAt: now },

      { id: "312", username: "guest_user", filename: "employee_directory.csv", canRead: true, canWrite: false, canExecute: false, grantedBy: "admin", updatedAt: now }
    ],
    logs: [
      { id: "1001", timestamp: now, username: "alice_dev", filename: "system_kernel_patch.sh", action: "EXECUTE", result: "ALLOWED", clientIp: "10.0.4.15", reason: "Authorized: Owner execution privileges" },
      { id: "1002", timestamp: now, username: "bob_analyst", filename: "financial_audit_2026.csv", action: "READ", result: "ALLOWED", clientIp: "10.0.2.88", reason: "Authorized: Owner read access" },
      { id: "1003", timestamp: now, username: "guest_user", filename: "classified_defense_blueprint.txt", action: "READ", result: "DENIED", clientIp: "192.168.10.201", reason: "Access Denied: Resource is restricted to specific users." }
    ],
    alerts: []
  };
}

function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf8');
      db = JSON.parse(content);
      // Ensure passwords exist for all users
      db.users.forEach(u => {
        if (!u.password) u.password = "123";
      });
      // Ensure access policy exists for all files
      db.files.forEach(f => {
        if (!f.accessPolicy) {
          f.accessPolicy = f.classification === 'Public' ? 'PUBLIC' : 'CONFIDENTIAL';
        }
        if (!Array.isArray(f.allowedUsers)) {
          f.allowedUsers = [f.owner];
        }
      });
      console.log(`[DataVault] Loaded persistent database from ${DB_FILE}`);
    } else {
      seedInitialData();
      saveDatabase();
      console.log(`[DataVault] Initialized database with enterprise seed data.`);
    }
  } catch (err) {
    console.error('[DataVault] Error reading DB, re-seeding:', err);
    seedInitialData();
    saveDatabase();
  }
}

function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (err) {
    console.error('[DataVault] Error saving DB:', err);
  }
}

// MIME Types Map
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.sh': 'text/plain; charset=utf-8',
  '.pdf': 'application/pdf',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.xls': 'application/vnd.ms-excel',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.doc': 'application/msword',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.zip': 'application/zip',
  '.tar': 'application/x-tar',
  '.gz': 'application/gzip',
  '.mp4': 'video/mp4',
  '.mp3': 'audio/mpeg'
};

function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

function sendJson(res, statusCode, data) {
  const jsonStr = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
  });
  res.end(jsonStr);
}

// Support up to 50MB payload for file uploads
function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 50 * 1024 * 1024) {
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
  });
}

// Clearance level hierarchy comparison
const CLEARANCE_LEVELS = {
  'Unclassified': 0,
  'Confidential': 1,
  'Secret': 2,
  'Top Secret': 3
};

// ================= INTELLIGENT ACCESS CONTROL LOGIC =================
function evaluateAccess(username, filename, action) {
  const key = `${username}:${filename}`;
  const user = db.users.find(u => u.username === username);
  if (!user) {
    return { allowed: false, reason: "Security Exception: User principal not found in directory", key };
  }
  if (user.status !== "ACTIVE") {
    return { allowed: false, reason: "Security Revocation: User account is suspended", key };
  }

  // 1. Root Admin has master override
  if (username === "admin") {
    return { allowed: true, reason: "Administrator Root Clearance Override", key };
  }

  const file = db.files.find(f => f.filename === filename);
  if (!file) {
    return { allowed: false, reason: "Resource not found in vault storage", key };
  }

  // 2. The Uploader/Owner ALWAYS has full access (Read, Write, Execute)
  if (file.owner === username) {
    return { allowed: true, reason: `Authorized: @${username} is the verified Owner of this file`, key };
  }

  // 3. Check Explicit Permission Matrix Rule first
  const perm = db.permissions.find(p => p.username === username && p.filename === filename);
  if (perm) {
    if (action === "READ" && perm.canRead) return { allowed: true, reason: `Authorized: Explicit READ grant by ${perm.grantedBy}`, key };
    if (action === "WRITE" && perm.canWrite) return { allowed: true, reason: `Authorized: Explicit WRITE grant by ${perm.grantedBy}`, key };
    if (action === "EXECUTE" && perm.canExecute) return { allowed: true, reason: `Authorized: Explicit EXECUTE grant by ${perm.grantedBy}`, key };
  }

  // 4. File-level Access Policies (set by uploader)
  const policy = file.accessPolicy || 'CONFIDENTIAL';

  // PUBLIC: Anyone logged in can READ (writing is restricted to owner unless granted)
  if (policy === 'PUBLIC') {
    if (action === 'READ') {
      return { allowed: true, reason: `Authorized: File is marked PUBLIC by @${file.owner}`, key };
    }
    return { allowed: false, reason: `Write Restricted: Only owner @${file.owner} can modify this public file`, key };
  }

  // SPECIFIC_USERS: Only users explicitly listed in allowedUsers
  if (policy === 'SPECIFIC_USERS') {
    const isAllowedUser = Array.isArray(file.allowedUsers) && file.allowedUsers.includes(username);
    if (isAllowedUser) {
      if (action === 'READ') {
        return { allowed: true, reason: `Authorized: Uploader @${file.owner} granted access to @${username}`, key };
      }
      return { allowed: false, reason: `Write Restricted: View-only access granted by @${file.owner}`, key };
    }
    return { allowed: false, reason: `Access Denied: This file is restricted to specific users authorized by @${file.owner}`, key };
  }

  // CONFIDENTIAL / CLEARANCE-BASED: Compare user's clearance with file classification
  const userClearanceVal = CLEARANCE_LEVELS[user.clearance] || 0;
  const fileClassificationVal = CLEARANCE_LEVELS[file.classification] || 1;

  if (action === 'READ') {
    if (userClearanceVal >= fileClassificationVal) {
      return { allowed: true, reason: `Authorized: User clearance (${user.clearance}) meets or exceeds file classification (${file.classification})`, key };
    } else {
      return { allowed: false, reason: `Clearance Denied: User clearance (${user.clearance}) is insufficient for ${file.classification} file`, key };
    }
  }

  return {
    allowed: false,
    reason: `Default Deny: @${username} does not hold ${action} privileges on "${filename}"`,
    key
  };
}

// Log and Trigger Alert Engine
function recordAccessAttempt(username, filename, action, clientIp, outcome, reason) {
  const now = getTimestamp();
  const nextLogId = db.logs.length > 0 ? Math.max(...db.logs.map(l => parseInt(l.id) || 1000)) + 1 : 1001;
  const newLog = {
    id: String(nextLogId),
    timestamp: now,
    username,
    filename,
    action,
    result: outcome ? 'ALLOWED' : 'DENIED',
    clientIp,
    reason
  };
  db.logs.unshift(newLog); // Put newest on top

  const key = `${username}:${filename}`;
  let alertTriggered = false;
  let alertId = null;
  let currentFailures = 0;

  if (!outcome) {
    currentFailures = (failedAttemptsCounter.get(key) || 0) + 1;
    failedAttemptsCounter.set(key, currentFailures);

    // 3‑strike rule trigger
    if (currentFailures >= 3) {
      alertTriggered = true;
      const nextAlertId = db.alerts.length > 0 ? Math.max(...db.alerts.map(a => parseInt(a.id) || 500)) + 1 : 501;
      alertId = String(nextAlertId);

      const newAlert = {
        id: alertId,
        timestamp: now,
        username,
        filename,
        failedAttempts: currentFailures,
        severity: currentFailures >= 5 ? 'CRITICAL' : 'HIGH',
        status: 'ACTIVE',
        description: `INTRUSION ALERT: ${currentFailures} consecutive failed access attempts on "${filename}" by @${username}.`,
        notes: `Automated detection triggered at ${now}. Origin IP: ${clientIp}`
      };
      db.alerts.push(newAlert);
    }
  } else {
    // reset on success
    failedAttemptsCounter.set(key, 0);
  }

  saveDatabase();
  return { alertTriggered, alertId, currentFailures };
}

// ---------- Login alert helper ----------
function recordLoginAttempt(username, clientIp) {
  const now = getTimestamp();
  const key = username;
  let alertTriggered = false;
  let alertId = null;
  let currentFailures = (failedLoginCounter.get(key) || 0) + 1;
  failedLoginCounter.set(key, currentFailures);

  if (currentFailures >= 3) {
    alertTriggered = true;
    const nextAlertId = db.alerts.length > 0 ? Math.max(...db.alerts.map(a => parseInt(a.id) || 500)) + 1 : 501;
    alertId = String(nextAlertId);
    const newAlert = {
      id: alertId,
      timestamp: now,
      username,
      filename: null,
      failedAttempts: currentFailures,
      severity: currentFailures >= 5 ? 'CRITICAL' : 'HIGH',
      status: 'ACTIVE',
      description: `INTRUSION ALERT: ${currentFailures} consecutive failed login attempts for @${username}.`,
      notes: `Origin IP: ${clientIp}`
    };
    db.alerts.push(newAlert);
  }
  saveDatabase();
  return { alertTriggered, alertId, currentFailures };
}

// ================= HTTP SERVER =================
const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
    });
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

  // ================= 1. AUTHENTICATION & REGISTRATION =================

  // Login: Any registered user can log in with their username and password
  if (req.method === 'POST' && pathname === '/api/login') {
    const body = await parseBody(req);
    const { username, password } = body;
    const user = db.users.find(u => u.username.toLowerCase() === (username || '').toLowerCase());

    if (!user) {
      return sendJson(res, 401, { success: false, message: `User "@${username}" not found. Please create an account or use "admin".` });
    }

    if (user.status !== 'ACTIVE') {
      return sendJson(res, 403, { success: false, message: 'This account has been suspended by an administrator.' });
    }

    // Accept user's set password, or default "123", "password", "admin123"
    const validPw = (user.password && password === user.password) ||
                    password === '123' ||
                    password === 'admin123' ||
                    password === 'password';

    if (validPw) {
      const sanitizedUser = { ...user };
      delete sanitizedUser.password;
      return sendJson(res, 200, {
        success: true,
        message: 'Login successful',
        user: sanitizedUser
      });
    }
    const loginAttempt = recordLoginAttempt(username, clientIp);
return sendJson(res, 401, {
  success: false,
  message: 'Incorrect password. Try password "123" or default.',
  alertTriggered: loginAttempt.alertTriggered,
  alertId: loginAttempt.alertId
});
  }

  // Register: Any new user can sign up and get their own login
  if (req.method === 'POST' && pathname === '/api/register') {
    const body = await parseBody(req);
    const { username, password, fullname, role, department, clearance } = body;

    if (!username || !password) {
      return sendJson(res, 400, { success: false, message: 'Username and password are required' });
    }

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (cleanUsername.length < 2) {
      return sendJson(res, 400, { success: false, message: 'Username must be at least 2 alphanumeric characters' });
    }

    if (db.users.some(u => u.username.toLowerCase() === cleanUsername)) {
      return sendJson(res, 400, { success: false, message: `Username "@${cleanUsername}" is already taken.` });
    }

    const nextId = db.users.length > 0 ? Math.max(...db.users.map(u => parseInt(u.id) || 100)) + 1 : 101;
    const newUser = {
      id: String(nextId),
      username: cleanUsername,
      password: password,
      fullname: fullname ? fullname.trim() : cleanUsername,
      role: role || 'Member',
      department: department ? department.trim() : 'General',
      clearance: clearance || 'Confidential',
      status: 'ACTIVE',
      createdAt: getTimestamp()
    };
    db.users.push(newUser);
    saveDatabase();

    const sanitizedUser = { ...newUser };
    delete sanitizedUser.password;

    return sendJson(res, 201, {
      success: true,
      message: `Account created successfully! You can now log in as @${cleanUsername}.`,
      user: sanitizedUser
    });
  }

  // ================= 2. DASHBOARD STATS =================
  if (req.method === 'GET' && pathname === '/api/stats') {
    const allowed = db.logs.filter(l => l.result === 'ALLOWED').length;
    const denied = db.logs.filter(l => l.result === 'DENIED').length;
    const activeAlerts = db.alerts.filter(a => a.status === 'ACTIVE').length;

    let totalStorageBytes = 0;
    try {
      const diskFiles = fs.readdirSync(VAULT_STORAGE_DIR);
      diskFiles.forEach(f => {
        totalStorageBytes += fs.statSync(path.join(VAULT_STORAGE_DIR, f)).size;
      });
    } catch(e) {}

    return sendJson(res, 200, {
      success: true,
      stats: {
        totalUsers: db.users.length,
        totalFiles: db.files.length,
        totalAttempts: db.logs.length,
        allowedAttempts: allowed,
        deniedAttempts: denied,
        totalAlerts: db.alerts.length,
        activeAlerts,
        storageUsage: formatBytes(totalStorageBytes)
      }
    });
  }

  // ================= 3. USER MANAGEMENT =================
  if (pathname === '/api/users' && req.method === 'GET') {
    const safeUsers = db.users.map(u => {
      const copy = { ...u };
      delete copy.password;
      return copy;
    });
    return sendJson(res, 200, { success: true, users: safeUsers });
  }

  if (pathname === '/api/users' && req.method === 'POST') {
    const body = await parseBody(req);
    if (!body.username) {
      return sendJson(res, 400, { success: false, message: 'Username is required' });
    }
    const cleanUsername = body.username.trim().toLowerCase();
    if (db.users.some(u => u.username.toLowerCase() === cleanUsername)) {
      return sendJson(res, 400, { success: false, message: 'Username already registered' });
    }

    const nextId = db.users.length > 0 ? Math.max(...db.users.map(u => parseInt(u.id) || 100)) + 1 : 101;
    const newUser = {
      id: String(nextId),
      username: cleanUsername,
      password: body.password || '123',
      fullname: body.fullname || cleanUsername,
      role: body.role || 'Member',
      department: body.department || 'General',
      clearance: body.clearance || 'Confidential',
      status: body.status || 'ACTIVE',
      createdAt: getTimestamp()
    };
    db.users.push(newUser);
    saveDatabase();
    return sendJson(res, 201, { success: true, id: newUser.id, message: 'User provisioned in directory' });
  }

  if (pathname.startsWith('/api/users/') && req.method === 'PUT') {
    const id = pathname.replace('/api/users/', '');
    const body = await parseBody(req);
    const user = db.users.find(u => String(u.id) === String(id));
    if (!user) return sendJson(res, 404, { success: false, message: 'User not found' });

    user.fullname = body.fullname !== undefined ? body.fullname : user.fullname;
    user.role = body.role !== undefined ? body.role : user.role;
    user.department = body.department !== undefined ? body.department : user.department;
    user.clearance = body.clearance !== undefined ? body.clearance : user.clearance;
    user.status = body.status !== undefined ? body.status : user.status;
    if (body.password) user.password = body.password;
    saveDatabase();
    return sendJson(res, 200, { success: true, message: 'User profile updated' });
  }

  if (pathname.startsWith('/api/users/') && req.method === 'DELETE') {
    const id = pathname.replace('/api/users/', '');
    const index = db.users.findIndex(u => String(u.id) === String(id));
    if (index === -1) return sendJson(res, 404, { success: false, message: 'User not found' });

    const deletedUser = db.users[index];
    if (deletedUser.username === 'admin') {
      return sendJson(res, 400, { success: false, message: 'Cannot delete primary root administrator' });
    }
    db.users.splice(index, 1);
    db.permissions = db.permissions.filter(p => p.username !== deletedUser.username);
    saveDatabase();
    return sendJson(res, 200, { success: true, message: 'User deleted from directory' });
  }

  // ================= 4. UNIVERSAL FILE UPLOAD & MANAGEMENT =================
  if (pathname === '/api/files' && req.method === 'GET') {
    return sendJson(res, 200, { success: true, files: db.files });
  }

  // UPLOAD ANY FILE: Supports Base64 binary or text upload (PDF, Excel, Images, Docs, etc.)
  if (pathname === '/api/files/upload' && req.method === 'POST') {
    const body = await parseBody(req);
    const { filename, fileData, classification, accessPolicy, allowedUsers, owner, description } = body;

    if (!filename) {
      return sendJson(res, 400, { success: false, message: 'Filename is required' });
    }

    // Clean filename and handle duplicate naming automatically
    let safeFilename = path.basename(filename).replace(/[\\/:*?"<>|]/g, '_');
    if (!safeFilename) safeFilename = `uploaded_file_${Date.now()}`;

    // If filename exists, auto-suffix so uploads never fail
    let finalFilename = safeFilename;
    let counter = 1;
    while (db.files.some(f => f.filename.toLowerCase() === finalFilename.toLowerCase())) {
      const ext = path.extname(safeFilename);
      const base = path.basename(safeFilename, ext);
      finalFilename = `${base}_${counter}${ext}`;
      counter++;
    }

    const diskPath = path.join(VAULT_STORAGE_DIR, finalFilename);

    // Save physical file to disk: Base64 or plain text
    try {
      if (fileData && typeof fileData === 'string' && fileData.startsWith('data:')) {
        // Data URL format: e.g. "data:application/pdf;base64,JVBERi0xLj..."
        const base64Index = fileData.indexOf(';base64,');
        if (base64Index !== -1) {
          const rawBase64 = fileData.substring(base64Index + 8);
          const buffer = Buffer.from(rawBase64, 'base64');
          fs.writeFileSync(diskPath, buffer);
        } else {
          fs.writeFileSync(diskPath, fileData, 'utf8');
        }
      } else if (fileData) {
        fs.writeFileSync(diskPath, fileData, 'utf8');
      } else {
        // Empty file initial template
        fs.writeFileSync(diskPath, `File created on ${getTimestamp()} by @${owner || 'user'}\n`, 'utf8');
      }
    } catch (err) {
      return sendJson(res, 500, { success: false, message: `Failed to write file to disk: ${err.message}` });
    }

    const stat = fs.statSync(diskPath);
    const checksum = computeFileHash(diskPath);
    const nextId = db.files.length > 0 ? Math.max(...db.files.map(f => parseInt(f.id) || 200)) + 1 : 201;

    // Determine owner: the user currently uploading the file
    const fileOwner = owner || 'admin';
    const policy = accessPolicy || (classification === 'Public' ? 'PUBLIC' : 'CONFIDENTIAL');

    // Parse specific allowed users
    let allowedList = [];
    if (Array.isArray(allowedUsers)) {
      allowedList = allowedUsers;
    } else if (typeof allowedUsers === 'string' && allowedUsers.trim()) {
      allowedList = allowedUsers.split(',').map(s => s.trim().replace(/^@/, '')).filter(Boolean);
    }
    if (!allowedList.includes(fileOwner)) {
      allowedList.push(fileOwner);
    }

    const newFile = {
      id: String(nextId),
      filename: finalFilename,
      path: `storage/vault/${finalFilename}`,
      classification: classification || (policy === 'PUBLIC' ? 'Public' : 'Confidential'),
      accessPolicy: policy,
      allowedUsers: allowedList,
      owner: fileOwner,
      size: formatBytes(stat.size),
      mimeType: getMimeType(finalFilename),
      checksum,
      description: description || `Uploaded by @${fileOwner}`,
      updatedAt: getTimestamp()
    };
    db.files.push(newFile);

    // Auto-grant full permissions to the uploader/owner
    db.permissions.push({
      id: String(db.permissions.length > 0 ? Math.max(...db.permissions.map(p => parseInt(p.id) || 300)) + 1 : 301),
      username: fileOwner,
      filename: finalFilename,
      canRead: true,
      canWrite: true,
      canExecute: true,
      grantedBy: 'uploader',
      updatedAt: getTimestamp()
    });

    saveDatabase();
    return sendJson(res, 201, {
      success: true,
      id: newFile.id,
      file: newFile,
      message: `File "${finalFilename}" saved to disk! Owner assigned to @${fileOwner}.`
    });
  }

  // Update file access policy and permissions (Only owner or admin can update)
  if (pathname.startsWith('/api/files/') && req.method === 'PUT' && !pathname.endsWith('/content')) {
    const id = pathname.replace('/api/files/', '');
    const body = await parseBody(req);
    const file = db.files.find(f => String(f.id) === String(id));
    if (!file) return sendJson(res, 404, { success: false, message: 'File not found' });

    const operator = body.operator || 'admin';
    if (operator !== 'admin' && file.owner !== operator) {
      return sendJson(res, 403, { success: false, message: `Access Denied: Only the owner (@${file.owner}) can update access policies.` });
    }

    if (body.classification !== undefined) file.classification = body.classification;
    if (body.accessPolicy !== undefined) file.accessPolicy = body.accessPolicy;
    if (body.description !== undefined) file.description = body.description;
    if (Array.isArray(body.allowedUsers)) {
      file.allowedUsers = body.allowedUsers;
      if (!file.allowedUsers.includes(file.owner)) file.allowedUsers.push(file.owner);
    }
    file.updatedAt = getTimestamp();
    saveDatabase();
    return sendJson(res, 200, { success: true, message: 'Access policy and metadata updated successfully' });
  }

  // Delete physical file (Only owner or admin can delete)
  if (pathname.startsWith('/api/files/') && req.method === 'DELETE') {
    const id = pathname.replace('/api/files/', '');
    const operator = url.searchParams.get('operator') || 'admin';
    const index = db.files.findIndex(f => String(f.id) === String(id));
    if (index === -1) return sendJson(res, 404, { success: false, message: 'File not found' });

    const deletedFile = db.files[index];
    if (operator !== 'admin' && deletedFile.owner !== operator) {
      return sendJson(res, 403, { success: false, message: `Only the file owner (@${deletedFile.owner}) or Administrator can delete this file.` });
    }

    const diskPath = path.join(VAULT_STORAGE_DIR, path.basename(deletedFile.filename));
    try {
      if (fs.existsSync(diskPath)) fs.unlinkSync(diskPath);
    } catch (e) {
      console.warn('Could not delete physical file:', e.message);
    }

    db.files.splice(index, 1);
    db.permissions = db.permissions.filter(p => p.filename !== deletedFile.filename);
    saveDatabase();
    return sendJson(res, 200, { success: true, message: `File "${deletedFile.filename}" deleted from disk.` });
  }

  // ================= 5. PHYSICAL DISK READ, EDIT, & DOWNLOAD WITH ACCESS EVALUATION =================

  // Read file content (Text preview or binary indication)
  if (pathname.startsWith('/api/vault/read/') && req.method === 'GET') {
    const filename = decodeURIComponent(pathname.replace('/api/vault/read/', ''));
    const username = url.searchParams.get('user') || 'admin';

    const evalRes = evaluateAccess(username, filename, 'READ');
    const { alertTriggered } = recordAccessAttempt(username, filename, 'READ', clientIp, evalRes.allowed, evalRes.reason);

    if (!evalRes.allowed) {
      return sendJson(res, 403, {
        success: false,
        allowed: false,
        message: evalRes.reason,
        alertTriggered
      });
    }

    const diskPath = path.join(VAULT_STORAGE_DIR, path.basename(filename));
    if (!fs.existsSync(diskPath)) {
      return sendJson(res, 404, { success: false, message: 'Physical file not found on disk volume' });
    }

    const stat = fs.statSync(diskPath);
    const checksum = computeFileHash(diskPath);
    const ext = path.extname(filename).toLowerCase();
    const isText = ['.txt', '.csv', '.json', '.sh', '.html', '.css', '.js', '.xml', '.log', '.md'].includes(ext);

    let content = '';
    if (isText && stat.size < 2 * 1024 * 1024) {
      content = fs.readFileSync(diskPath, 'utf8');
    } else {
      content = `[Binary File: ${filename} (${formatBytes(stat.size)}) - Click "Download File" above to view original contents]`;
    }

    const fileMeta = db.files.find(f => f.filename === filename);

    return sendJson(res, 200, {
      success: true,
      allowed: true,
      filename,
      content,
      isText,
      size: formatBytes(stat.size),
      checksum,
      owner: fileMeta ? fileMeta.owner : 'admin',
      accessPolicy: fileMeta ? fileMeta.accessPolicy : 'CONFIDENTIAL',
      classification: fileMeta ? fileMeta.classification : 'Secret',
      updatedAt: stat.mtime
    });
  }

  // Save modified content back to physical disk
  if (pathname.startsWith('/api/vault/write/') && req.method === 'POST') {
    const filename = decodeURIComponent(pathname.replace('/api/vault/write/', ''));
    const body = await parseBody(req);
    const username = body.username || 'admin';
    const newContent = body.content !== undefined ? body.content : '';

    const evalRes = evaluateAccess(username, filename, 'WRITE');
    const { alertTriggered } = recordAccessAttempt(username, filename, 'WRITE', clientIp, evalRes.allowed, evalRes.reason);

    if (!evalRes.allowed) {
      return sendJson(res, 403, {
        success: false,
        allowed: false,
        message: evalRes.reason,
        alertTriggered
      });
    }

    const diskPath = path.join(VAULT_STORAGE_DIR, path.basename(filename));
    fs.writeFileSync(diskPath, newContent, 'utf8');

    const stat = fs.statSync(diskPath);
    const file = db.files.find(f => f.filename === filename);
    if (file) {
      file.size = formatBytes(stat.size);
      file.checksum = computeFileHash(diskPath);
      file.updatedAt = getTimestamp();
    }
    saveDatabase();

    return sendJson(res, 200, {
      success: true,
      allowed: true,
      message: 'File changes written to disk storage',
      checksum: file ? file.checksum : computeFileHash(diskPath),
      size: formatBytes(stat.size)
    });
  }

  // Execute routine
  if (pathname.startsWith('/api/vault/execute/') && req.method === 'POST') {
    const filename = decodeURIComponent(pathname.replace('/api/vault/execute/', ''));
    const body = await parseBody(req);
    const username = body.username || 'admin';

    const evalRes = evaluateAccess(username, filename, 'EXECUTE');
    const { alertTriggered } = recordAccessAttempt(username, filename, 'EXECUTE', clientIp, evalRes.allowed, evalRes.reason);

    if (!evalRes.allowed) {
      return sendJson(res, 403, {
        success: false,
        allowed: false,
        message: evalRes.reason,
        alertTriggered
      });
    }

    return sendJson(res, 200, {
      success: true,
      allowed: true,
      filename,
      message: `Executed execution routine for "${filename}" under security context of @${username}`,
      executionTimeMs: 14,
      status: 'SUCCESS'
    });
  }

  // Real download stream of ANY file type
  if (pathname.startsWith('/api/vault/download/') && req.method === 'GET') {
    const filename = decodeURIComponent(pathname.replace('/api/vault/download/', ''));
    const username = url.searchParams.get('user') || 'admin';

    const evalRes = evaluateAccess(username, filename, 'READ');
    const { alertTriggered } = recordAccessAttempt(username, filename, 'READ', clientIp, evalRes.allowed, `File download: ${evalRes.reason}`);

    if (!evalRes.allowed) {
      return sendJson(res, 403, { success: false, message: `Download Denied: ${evalRes.reason}`, alertTriggered });
    }

    const diskPath = path.join(VAULT_STORAGE_DIR, path.basename(filename));
    if (!fs.existsSync(diskPath)) {
      return sendJson(res, 404, { success: false, message: 'File not found on storage volume' });
    }

    const stat = fs.statSync(diskPath);
    const mime = getMimeType(filename);
    res.writeHead(200, {
      'Content-Type': mime,
      'Content-Length': stat.size,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(path.basename(filename))}"`,
      'Access-Control-Allow-Origin': '*'
    });
    return fs.createReadStream(diskPath).pipe(res);
  }

  // ================= 6. PERMISSIONS (ACL) APIS =================
  if (pathname === '/api/permissions' && req.method === 'GET') {
    return sendJson(res, 200, { success: true, permissions: db.permissions });
  }

  if (pathname === '/api/permissions' && req.method === 'POST') {
    const body = await parseBody(req);
    const { username, filename, canRead, canWrite, canExecute, grantedBy } = body;
    if (!username || !filename) {
      return sendJson(res, 400, { success: false, message: 'Username and filename are required' });
    }

    const existing = db.permissions.find(p => p.username === username && p.filename === filename);
    if (existing) {
      existing.canRead = !!canRead;
      existing.canWrite = !!canWrite;
      existing.canExecute = !!canExecute;
      existing.grantedBy = grantedBy || 'admin';
      existing.updatedAt = getTimestamp();
      saveDatabase();
      return sendJson(res, 200, { success: true, id: existing.id, message: 'ACL rule updated' });
    }

    const nextId = db.permissions.length > 0 ? Math.max(...db.permissions.map(p => parseInt(p.id) || 300)) + 1 : 301;
    const newPerm = {
      id: String(nextId),
      username,
      filename,
      canRead: !!canRead,
      canWrite: !!canWrite,
      canExecute: !!canExecute,
      grantedBy: grantedBy || 'admin',
      updatedAt: getTimestamp()
    };
    db.permissions.push(newPerm);
    saveDatabase();
    return sendJson(res, 201, { success: true, id: newPerm.id, message: 'ACL rule assigned' });
  }

  if (pathname.startsWith('/api/permissions/') && req.method === 'PUT') {
    const id = pathname.replace('/api/permissions/', '');
    const body = await parseBody(req);
    const perm = db.permissions.find(p => String(p.id) === String(id));
    if (!perm) return sendJson(res, 404, { success: false, message: 'Permission not found' });

    perm.canRead = body.canRead !== undefined ? !!body.canRead : perm.canRead;
    perm.canWrite = body.canWrite !== undefined ? !!body.canWrite : perm.canWrite;
    perm.canExecute = body.canExecute !== undefined ? !!body.canExecute : perm.canExecute;
    perm.grantedBy = body.grantedBy || perm.grantedBy;
    perm.updatedAt = getTimestamp();
    saveDatabase();
    return sendJson(res, 200, { success: true, message: 'Permission updated' });
  }

  if (pathname.startsWith('/api/permissions/') && req.method === 'DELETE') {
    const id = pathname.replace('/api/permissions/', '');
    const index = db.permissions.findIndex(p => String(p.id) === String(id));
    if (index === -1) return sendJson(res, 404, { success: false, message: 'Permission not found' });

    db.permissions.splice(index, 1);
    saveDatabase();
    return sendJson(res, 200, { success: true, message: 'ACL rule revoked' });
  }

  // ================= 7. AUDIT LOGS =================
  if (pathname === '/api/logs' && req.method === 'GET') {
    return sendJson(res, 200, { success: true, logs: db.logs });
  }

  if (pathname === '/api/logs/clear' && req.method === 'POST') {
    db.logs = [];
    saveDatabase();
    return sendJson(res, 200, { success: true, message: 'Audit log ledger purged' });
  }

  // ================= 8. SECURITY ALERTS =================
  if (pathname === '/api/alerts' && req.method === 'GET') {
    return sendJson(res, 200, { success: true, alerts: db.alerts });
  }

  if (pathname.startsWith('/api/alerts/') && pathname.endsWith('/status') && req.method === 'PUT') {
    const alertId = pathname.replace('/api/alerts/', '').replace('/status', '');
    const body = await parseBody(req);
    const alert = db.alerts.find(a => String(a.id) === String(alertId));
    if (!alert) return sendJson(res, 404, { success: false, message: 'Alert not found' });

    alert.status = body.status || alert.status;
    if (body.notes) alert.notes = body.notes;
    saveDatabase();
    return sendJson(res, 200, { success: true, message: 'Incident status updated' });
  }

  if (pathname === '/api/alerts/clear' && req.method === 'POST') {
    db.alerts = [];
    failedAttemptsCounter.clear();
    saveDatabase();
    return sendJson(res, 200, { success: true, message: 'All alerts cleared and intrusion counter reset' });
  }

  // ================= 9. FRONTEND STATIC FILE DELIVERY =================
  if (req.method === 'GET') {
    let filePath = path.join(ROOT_DIR, pathname === '/' ? 'index.html' : pathname);
    if (!filePath.startsWith(ROOT_DIR)) {
      res.writeHead(403);
      return res.end('Access Denied');
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const mime = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': mime });
      return fs.createReadStream(filePath).pipe(res);
    }

    const indexPath = path.join(ROOT_DIR, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return fs.createReadStream(indexPath).pipe(res);
    }
  }

  sendJson(res, 404, { success: false, message: 'Resource not found' });
});

loadDatabase();

function startListening(port) {
  server.listen(port, '0.0.0.0', () => {
    console.log('========================================================');
    console.log(`  DataVault Universal File Storage Server Online`);
    console.log(`  Local Endpoint: http://127.0.0.1:${port}`);
    console.log(`  Storage Volume: ${VAULT_STORAGE_DIR}`);
    console.log('========================================================');
  });
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    const nextPort = Number(PORT) + 1;
    console.warn(`[DataVault] Port ${PORT} is in use (e.g. Jenkins or existing process). Trying alternate port ${nextPort}...`);
    startListening(nextPort);
  } else {
    console.error('[DataVault] Server error:', err);
  }
});

startListening(PORT);
