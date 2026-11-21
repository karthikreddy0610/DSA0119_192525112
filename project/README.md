# DataVault – Secure File Access & Universal Storage System

A modern, easy-to-use web-based file security management and access auditing application.

---

## 🚀 How Anyone Can Access and Use the Application

### 1. Local & LAN (Network) Access
- **Local Machine**: **`http://localhost:8000`** or **`http://127.0.0.1:8000`**
- **Any Device on Same Wi-Fi / College Network** (Mobile phones, laptops, teammates):
  👉 **`http://10.65.157.247:8000`**

### 2. Worldwide Public Cloudflare Tunnel Access
To launch the Cloudflare Tunnel so anyone outside your network can open the app:
1. Double click **`start_with_cloudflare.bat`** in the project folder.
2. It gives you a live public HTTPS address (e.g. `https://items-figure-plugins-arrangements.trycloudflare.com`).

---

## 🔑 User Logins & Registration (Fixed & Simple)

### A. Pre-configured Users (Ready to Test):
All default test accounts have simple passwords:
| Username | Password | Role / Department | Security Clearance |
|---|---|---|---|
| **`admin`** | `admin123` *(or `123`)* | SecOps Administrator | Top Secret |
| **`alice_dev`** | `123` | Lead Systems Architect | Secret |
| **`bob_analyst`** | `123` | Financial Auditor | Confidential |
| **`sarah_sec`** | `123` | Chief Security Officer | Top Secret |
| **`guest_user`** | `123` | External Auditor | Unclassified |

### B. Anyone Can Create Their Own Account:
1. Click the **"Create Account"** tab on the login screen.
2. Enter your username, full name, and password.
3. Click **"Create Account & Log In"**.
4. You are immediately registered and signed in!

---

## 📁 How File Uploading & Ownership Works

### 1. Universal File Upload (PDF, Excel, Word, Images, etc.):
- Click the **"Upload File"** button at the top right of the dashboard.
- Choose **any file** from your computer (`.pdf`, `.xlsx`, `.docx`, `.png`, `.jpg`, `.csv`, `.txt`, `.zip`).
- **You are automatically recorded as the Owner of that file!**

### 2. The Uploader Sets the Access Policy:
When uploading (or later by clicking **"Policy"**), the uploader chooses who can view it:
- 🌐 **Public (All)**: Every registered user can view and download the file.
- 🔒 **Confidential (Clearance)**: Only users with matching or higher clearance can view it.
- 👤 **Specific Users Only**: Choose exactly which usernames are permitted (e.g., only `@alice_dev` and `@bob_analyst`).

---

## 🛡️ Security Alerts (3-Strikes Intrusion Detection)

If a user attempts to access a file they do not have permission for:
- **1st & 2nd attempt**: Access is denied and logged in the Access Audit Logs.
- **3rd consecutive attempt**: The system automatically triggers a **High-Severity Security Alert**!
- You can review and update all incidents under the **Security Alerts** page.

---

## 🛠️ How to Start the Project

Double-click:
```
run_server.bat
```
Or in PowerShell:
```powershell
node backend\server.js
```
Then open your browser to **`http://localhost:8000`** (or **`http://10.65.157.247:8000`** on your phone/other devices).
