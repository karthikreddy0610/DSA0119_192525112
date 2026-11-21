#pragma once

#include <string>
#include <vector>
#include <map>
#include <fstream>
#include <iostream>
#include <chrono>
#include <ctime>
#include <iomanip>
#include <mutex>
#include "json.hpp"

namespace Models {

struct User {
    std::string id;
    std::string username;
    std::string fullname;
    std::string role;       // Admin, Security Officer, Developer, Analyst, Auditor, Guest
    std::string department;
    std::string clearance;  // Top Secret, Secret, Confidential, Unclassified
    std::string status;     // ACTIVE, SUSPENDED
    std::string createdAt;

    SimpleJson::Value toJson() const {
        auto obj = SimpleJson::Value::object();
        obj["id"] = id;
        obj["username"] = username;
        obj["fullname"] = fullname;
        obj["role"] = role;
        obj["department"] = department;
        obj["clearance"] = clearance;
        obj["status"] = status;
        obj["createdAt"] = createdAt;
        return obj;
    }

    static User fromJson(const SimpleJson::Value& v) {
        User u;
        u.id = v.get("id").asString();
        u.username = v.get("username").asString();
        u.fullname = v.get("fullname").asString();
        u.role = v.get("role").asString("Developer");
        u.department = v.get("department").asString("Engineering");
        u.clearance = v.get("clearance").asString("Secret");
        u.status = v.get("status").asString("ACTIVE");
        u.createdAt = v.get("createdAt").asString();
        return u;
    }
};

struct FileItem {
    std::string id;
    std::string filename;
    std::string path;
    std::string classification; // Top Secret, Secret, Confidential, Public
    std::string owner;          // username
    std::string size;           // e.g. 2.4 MB
    std::string description;
    std::string updatedAt;

    SimpleJson::Value toJson() const {
        auto obj = SimpleJson::Value::object();
        obj["id"] = id;
        obj["filename"] = filename;
        obj["path"] = path;
        obj["classification"] = classification;
        obj["owner"] = owner;
        obj["size"] = size;
        obj["description"] = description;
        obj["updatedAt"] = updatedAt;
        return obj;
    }

    static FileItem fromJson(const SimpleJson::Value& v) {
        FileItem f;
        f.id = v.get("id").asString();
        f.filename = v.get("filename").asString();
        f.path = v.get("path").asString();
        f.classification = v.get("classification").asString("Secret");
        f.owner = v.get("owner").asString("admin");
        f.size = v.get("size").asString("1.0 MB");
        f.description = v.get("description").asString();
        f.updatedAt = v.get("updatedAt").asString();
        return f;
    }
};

struct Permission {
    std::string id;
    std::string username;
    std::string filename;
    bool canRead = false;
    bool canWrite = false;
    bool canExecute = false;
    std::string grantedBy;
    std::string updatedAt;

    SimpleJson::Value toJson() const {
        auto obj = SimpleJson::Value::object();
        obj["id"] = id;
        obj["username"] = username;
        obj["filename"] = filename;
        obj["canRead"] = canRead;
        obj["canWrite"] = canWrite;
        obj["canExecute"] = canExecute;
        obj["grantedBy"] = grantedBy;
        obj["updatedAt"] = updatedAt;
        return obj;
    }

    static Permission fromJson(const SimpleJson::Value& v) {
        Permission p;
        p.id = v.get("id").asString();
        p.username = v.get("username").asString();
        p.filename = v.get("filename").asString();
        p.canRead = v.get("canRead").asBool(false);
        p.canWrite = v.get("canWrite").asBool(false);
        p.canExecute = v.get("canExecute").asBool(false);
        p.grantedBy = v.get("grantedBy").asString("admin");
        p.updatedAt = v.get("updatedAt").asString();
        return p;
    }
};

struct AccessLog {
    std::string id;
    std::string timestamp;
    std::string username;
    std::string filename;
    std::string action; // READ, WRITE, EXECUTE
    std::string result; // ALLOWED, DENIED
    std::string clientIp;
    std::string reason;

    SimpleJson::Value toJson() const {
        auto obj = SimpleJson::Value::object();
        obj["id"] = id;
        obj["timestamp"] = timestamp;
        obj["username"] = username;
        obj["filename"] = filename;
        obj["action"] = action;
        obj["result"] = result;
        obj["clientIp"] = clientIp;
        obj["reason"] = reason;
        return obj;
    }

    static AccessLog fromJson(const SimpleJson::Value& v) {
        AccessLog l;
        l.id = v.get("id").asString();
        l.timestamp = v.get("timestamp").asString();
        l.username = v.get("username").asString();
        l.filename = v.get("filename").asString();
        l.action = v.get("action").asString();
        l.result = v.get("result").asString();
        l.clientIp = v.get("clientIp").asString("127.0.0.1");
        l.reason = v.get("reason").asString();
        return l;
    }
};

struct SecurityAlert {
    std::string id;
    std::string timestamp;
    std::string username;
    std::string filename;
    int failedAttempts = 3;
    std::string severity;   // HIGH, CRITICAL, MEDIUM, LOW
    std::string status;     // ACTIVE, INVESTIGATING, RESOLVED
    std::string description;
    std::string notes;

    SimpleJson::Value toJson() const {
        auto obj = SimpleJson::Value::object();
        obj["id"] = id;
        obj["timestamp"] = timestamp;
        obj["username"] = username;
        obj["filename"] = filename;
        obj["failedAttempts"] = failedAttempts;
        obj["severity"] = severity;
        obj["status"] = status;
        obj["description"] = description;
        obj["notes"] = notes;
        return obj;
    }

    static SecurityAlert fromJson(const SimpleJson::Value& v) {
        SecurityAlert a;
        a.id = v.get("id").asString();
        a.timestamp = v.get("timestamp").asString();
        a.username = v.get("username").asString();
        a.filename = v.get("filename").asString();
        a.failedAttempts = v.get("failedAttempts").asInt(3);
        a.severity = v.get("severity").asString("HIGH");
        a.status = v.get("status").asString("ACTIVE");
        a.description = v.get("description").asString();
        a.notes = v.get("notes").asString();
        return a;
    }
};

} // namespace Models

class DatabaseManager {
private:
    std::string dbFilePath;
    std::mutex dbMutex;

    int nextUserId = 100;
    int nextFileId = 200;
    int nextPermId = 300;
    int nextLogId = 1000;
    int nextAlertId = 500;

public:
    std::vector<Models::User> users;
    std::vector<Models::FileItem> files;
    std::vector<Models::Permission> permissions;
    std::vector<Models::AccessLog> logs;
    std::vector<Models::SecurityAlert> alerts;

    // Track consecutive failed attempts per "username:filename"
    std::map<std::string, int> failedAttemptsCounter;

    DatabaseManager(const std::string& filepath = "datavault_db.json") : dbFilePath(filepath) {
        loadFromFile();
        if (users.empty()) {
            seedInitialData();
            saveToFile();
        }
    }

    static std::string getCurrentTimestamp() {
        auto now = std::chrono::system_clock::now();
        std::time_t now_c = std::chrono::system_clock::to_time_t(now);
        std::tm tm_buf;
#if defined(_WIN32) || defined(_WIN64)
        localtime_s(&tm_buf, &now_c);
#else
        localtime_r(&now_c, &tm_buf);
#endif
        std::ostringstream ss;
        ss << std::put_time(&tm_buf, "%Y-%m-%d %H:%M:%S");
        return ss.str();
    }

    void loadFromFile() {
        std::lock_guard<std::mutex> lock(dbMutex);
        std::ifstream file(dbFilePath);
        if (!file.is_open()) return;

        std::string content((std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>());
        file.close();

        if (content.empty()) return;

        SimpleJson::Value root = SimpleJson::parse(content);
        if (!root.isObject()) return;

        // Load Users
        users.clear();
        const auto& uArr = root.get("users");
        if (uArr.isArray()) {
            for (const auto& item : uArr.arrVal) {
                users.push_back(Models::User::fromJson(item));
            }
        }

        // Load Files
        files.clear();
        const auto& fArr = root.get("files");
        if (fArr.isArray()) {
            for (const auto& item : fArr.arrVal) {
                files.push_back(Models::FileItem::fromJson(item));
            }
        }

        // Load Permissions
        permissions.clear();
        const auto& pArr = root.get("permissions");
        if (pArr.isArray()) {
            for (const auto& item : pArr.arrVal) {
                permissions.push_back(Models::Permission::fromJson(item));
            }
        }

        // Load Logs
        logs.clear();
        const auto& lArr = root.get("logs");
        if (lArr.isArray()) {
            for (const auto& item : lArr.arrVal) {
                logs.push_back(Models::AccessLog::fromJson(item));
            }
        }

        // Load Alerts
        alerts.clear();
        const auto& aArr = root.get("alerts");
        if (aArr.isArray()) {
            for (const auto& item : aArr.arrVal) {
                alerts.push_back(Models::SecurityAlert::fromJson(item));
            }
        }

        // Update ID counters to avoid collisions
        for (const auto& u : users) {
            try { int id = std::stoi(u.id); if (id >= nextUserId) nextUserId = id + 1; } catch (...) {}
        }
        for (const auto& f : files) {
            try { int id = std::stoi(f.id); if (id >= nextFileId) nextFileId = id + 1; } catch (...) {}
        }
        for (const auto& p : permissions) {
            try { int id = std::stoi(p.id); if (id >= nextPermId) nextPermId = id + 1; } catch (...) {}
        }
        for (const auto& l : logs) {
            try { int id = std::stoi(l.id); if (id >= nextLogId) nextLogId = id + 1; } catch (...) {}
        }
        for (const auto& a : alerts) {
            try { int id = std::stoi(a.id); if (id >= nextAlertId) nextAlertId = id + 1; } catch (...) {}
        }
    }

    void saveToFile() {
        std::lock_guard<std::mutex> lock(dbMutex);
        SimpleJson::Value root = SimpleJson::Value::object();

        auto uArr = SimpleJson::Value::array();
        for (const auto& u : users) uArr.push_back(u.toJson());
        root["users"] = uArr;

        auto fArr = SimpleJson::Value::array();
        for (const auto& f : files) fArr.push_back(f.toJson());
        root["files"] = fArr;

        auto pArr = SimpleJson::Value::array();
        for (const auto& p : permissions) pArr.push_back(p.toJson());
        root["permissions"] = pArr;

        auto lArr = SimpleJson::Value::array();
        for (const auto& l : logs) lArr.push_back(l.toJson());
        root["logs"] = lArr;

        auto aArr = SimpleJson::Value::array();
        for (const auto& a : alerts) aArr.push_back(a.toJson());
        root["alerts"] = aArr;

        std::ofstream file(dbFilePath);
        if (file.is_open()) {
            file << root.serialize();
            file.close();
        }
    }

    void seedInitialData() {
        std::string now = getCurrentTimestamp();

        // 1. Initial Users
        users = {
            { "101", "admin", "Administrator", "Admin", "SecOps", "Top Secret", "ACTIVE", now },
            { "102", "alice_dev", "Alice Johnson", "Developer", "Engineering", "Secret", "ACTIVE", now },
            { "103", "bob_analyst", "Bob Vance", "Analyst", "Finance", "Confidential", "ACTIVE", now },
            { "104", "sarah_sec", "Sarah Connor", "Security Officer", "SecOps", "Top Secret", "ACTIVE", now },
            { "105", "guest_user", "Guest Contractor", "Guest", "External", "Unclassified", "ACTIVE", now }
        };

        // 2. Initial Files
        files = {
            { "201", "financial_audit_2026.xlsx", "/vault/finance/financial_audit_2026.xlsx", "Confidential", "bob_analyst", "4.2 MB", "Q3 Internal revenue and budget audit", now },
            { "202", "classified_defense_blueprint.pdf", "/vault/defense/classified_defense_blueprint.pdf", "Top Secret", "sarah_sec", "18.5 MB", "Restricted schematics & access keys", now },
            { "203", "app_backend_source.tar.gz", "/vault/engineering/app_backend_source.tar.gz", "Secret", "alice_dev", "52.1 MB", "Core infrastructure server code", now },
            { "204", "employee_directory.csv", "/vault/hr/employee_directory.csv", "Public", "admin", "680 KB", "Company roster and public contact emails", now },
            { "205", "system_kernel_patch.sh", "/vault/ops/system_kernel_patch.sh", "Secret", "admin", "120 KB", "Automated deployment script", now }
        };

        // 3. Initial Permissions
        permissions = {
            { "301", "admin", "financial_audit_2026.xlsx", true, true, true, "system", now },
            { "302", "admin", "classified_defense_blueprint.pdf", true, true, true, "system", now },
            { "303", "admin", "app_backend_source.tar.gz", true, true, true, "system", now },
            { "304", "alice_dev", "app_backend_source.tar.gz", true, true, false, "admin", now },
            { "305", "alice_dev", "system_kernel_patch.sh", true, false, true, "admin", now },
            { "306", "bob_analyst", "financial_audit_2026.xlsx", true, true, false, "admin", now },
            { "307", "sarah_sec", "classified_defense_blueprint.pdf", true, true, false, "admin", now },
            { "308", "guest_user", "employee_directory.csv", true, false, false, "admin", now }
        };

        // 4. Initial Access Logs
        logs = {
            { "1001", now, "alice_dev", "app_backend_source.tar.gz", "READ", "ALLOWED", "192.168.1.102", "Granted by role permissions" },
            { "1002", now, "bob_analyst", "classified_defense_blueprint.pdf", "READ", "DENIED", "192.168.1.103", "Insufficient clearance & missing rule" },
            { "1003", now, "admin", "system_kernel_patch.sh", "EXECUTE", "ALLOWED", "127.0.0.1", "Admin full privilege access" }
        };

        nextUserId = 106;
        nextFileId = 206;
        nextPermId = 309;
        nextLogId = 1004;
        nextAlertId = 501;
    }

    // ================= CRUD: USERS =================
    std::string addUser(Models::User u) {
        u.id = std::to_string(nextUserId++);
        u.createdAt = getCurrentTimestamp();
        users.push_back(u);
        saveToFile();
        return u.id;
    }

    bool updateUser(const std::string& id, const Models::User& updated) {
        for (auto& u : users) {
            if (u.id == id) {
                u.fullname = updated.fullname;
                u.role = updated.role;
                u.department = updated.department;
                u.clearance = updated.clearance;
                u.status = updated.status;
                saveToFile();
                return true;
            }
        }
        return false;
    }

    bool deleteUser(const std::string& id) {
        std::string deletedUsername = "";
        for (auto it = users.begin(); it != users.end(); ++it) {
            if (it->id == id) {
                deletedUsername = it->username;
                users.erase(it);
                break;
            }
        }
        if (!deletedUsername.empty()) {
            // Also clean up permissions for this user
            permissions.erase(
                std::remove_if(permissions.begin(), permissions.end(),
                    [&](const Models::Permission& p) { return p.username == deletedUsername; }),
                permissions.end()
            );
            saveToFile();
            return true;
        }
        return false;
    }

    // ================= CRUD: FILES =================
    std::string addFile(Models::FileItem f) {
        f.id = std::to_string(nextFileId++);
        f.updatedAt = getCurrentTimestamp();
        files.push_back(f);
        saveToFile();
        return f.id;
    }

    bool updateFile(const std::string& id, const Models::FileItem& updated) {
        for (auto& f : files) {
            if (f.id == id) {
                f.path = updated.path;
                f.classification = updated.classification;
                f.owner = updated.owner;
                f.size = updated.size;
                f.description = updated.description;
                f.updatedAt = getCurrentTimestamp();
                saveToFile();
                return true;
            }
        }
        return false;
    }

    bool deleteFile(const std::string& id) {
        std::string deletedFilename = "";
        for (auto it = files.begin(); it != files.end(); ++it) {
            if (it->id == id) {
                deletedFilename = it->filename;
                files.erase(it);
                break;
            }
        }
        if (!deletedFilename.empty()) {
            // Clean up permissions for this file
            permissions.erase(
                std::remove_if(permissions.begin(), permissions.end(),
                    [&](const Models::Permission& p) { return p.filename == deletedFilename; }),
                permissions.end()
            );
            saveToFile();
            return true;
        }
        return false;
    }

    // ================= CRUD: PERMISSIONS =================
    std::string addOrUpdatePermission(Models::Permission p) {
        p.updatedAt = getCurrentTimestamp();
        for (auto& existing : permissions) {
            if (existing.username == p.username && existing.filename == p.filename) {
                existing.canRead = p.canRead;
                existing.canWrite = p.canWrite;
                existing.canExecute = p.canExecute;
                existing.grantedBy = p.grantedBy;
                existing.updatedAt = p.updatedAt;
                saveToFile();
                return existing.id;
            }
        }
        p.id = std::to_string(nextPermId++);
        permissions.push_back(p);
        saveToFile();
        return p.id;
    }

    bool deletePermission(const std::string& id) {
        for (auto it = permissions.begin(); it != permissions.end(); ++it) {
            if (it->id == id) {
                permissions.erase(it);
                saveToFile();
                return true;
            }
        }
        return false;
    }

    // ================= PERMISSION EVALUATION ENGINE =================
    struct AccessCheckResult {
        bool allowed = false;
        std::string reason;
        int consecutiveFailures = 0;
        bool alertTriggered = false;
        std::string alertId;
    };

    AccessCheckResult checkAccess(const std::string& username, const std::string& filename,
                                  const std::string& action, const std::string& clientIp) {
        AccessCheckResult result;
        std::string key = username + ":" + filename;

        // Verify user exists and is active
        bool userExists = false;
        bool userActive = true;
        for (const auto& u : users) {
            if (u.username == username) {
                userExists = true;
                if (u.status != "ACTIVE") userActive = false;
                break;
            }
        }

        if (!userExists) {
            result.allowed = false;
            result.reason = "User account not found in system directory";
        } else if (!userActive) {
            result.allowed = false;
            result.reason = "Account is currently suspended by administrator";
        } else if (username == "admin") {
            // Admin user always has master override
            result.allowed = true;
            result.reason = "Root administrator override granted";
        } else {
            // Check specific permission rule
            bool ruleFound = false;
            for (const auto& p : permissions) {
                if (p.username == username && p.filename == filename) {
                    ruleFound = true;
                    if (action == "READ" && p.canRead) result.allowed = true;
                    else if (action == "WRITE" && p.canWrite) result.allowed = true;
                    else if (action == "EXECUTE" && p.canExecute) result.allowed = true;

                    if (result.allowed) {
                        result.reason = "Authorized by explicit permission rule";
                    } else {
                        result.reason = "Missing " + action + " permission on target file";
                    }
                    break;
                }
            }

            if (!ruleFound) {
                result.allowed = false;
                result.reason = "No permission rule found for user on file (Default Deny)";
            }
        }

        // Add to audit logs
        Models::AccessLog log;
        log.id = std::to_string(nextLogId++);
        log.timestamp = getCurrentTimestamp();
        log.username = username;
        log.filename = filename;
        log.action = action;
        log.result = result.allowed ? "ALLOWED" : "DENIED";
        log.clientIp = clientIp.empty() ? "127.0.0.1" : clientIp;
        log.reason = result.reason;
        logs.push_back(log);

        // Security Alert Heuristics:
        // Detect repeated failed access attempts. Generate alert after 3 failed attempts for the same user & file.
        if (!result.allowed) {
            failedAttemptsCounter[key]++;
            result.consecutiveFailures = failedAttemptsCounter[key];

            if (result.consecutiveFailures >= 3) {
                result.alertTriggered = true;

                // Create or elevate alert
                Models::SecurityAlert alert;
                alert.id = std::to_string(nextAlertId++);
                alert.timestamp = getCurrentTimestamp();
                alert.username = username;
                alert.filename = filename;
                alert.failedAttempts = result.consecutiveFailures;
                alert.severity = (result.consecutiveFailures >= 5) ? "CRITICAL" : "HIGH";
                alert.status = "ACTIVE";
                alert.description = "Repeated unauthorized access: " + std::to_string(result.consecutiveFailures) +
                                   " consecutive failed " + action + " attempts.";
                alert.notes = "Automated detection triggered at " + alert.timestamp;
                alerts.push_back(alert);
                result.alertId = alert.id;
            }
        } else {
            // Reset consecutive failure counter on successful access
            failedAttemptsCounter[key] = 0;
            result.consecutiveFailures = 0;
        }

        saveToFile();
        return result;
    }

    void clearLogs() {
        logs.clear();
        saveToFile();
    }

    void clearAlerts() {
        alerts.clear();
        failedAttemptsCounter.clear();
        saveToFile();
    }

    bool updateAlertStatus(const std::string& alertId, const std::string& status, const std::string& notes) {
        for (auto& a : alerts) {
            if (a.id == alertId) {
                a.status = status;
                if (!notes.empty()) a.notes = notes;
                saveToFile();
                return true;
            }
        }
        return false;
    }
};
