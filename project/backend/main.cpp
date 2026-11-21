/**
 * DataVault – Secure File Access Monitoring System
 * Main C++ Application Entrypoint
 * Provides REST API and serves the frontend dashboard locally
 */

#include <iostream>
#include <string>
#include <memory>
#include <cstdlib>
#include "json.hpp"
#include "database.hpp"
#include "http_server.hpp"

// Utility helper to extract ID from URL like /api/users/102
std::string extractIdFromPath(const std::string& path, const std::string& prefix) {
    if (path.rfind(prefix, 0) == 0) {
        return path.substr(prefix.length());
    }
    return "";
}

int main(int argc, char* argv[]) {
    int port = 8000;
    if (argc > 1) {
        port = std::atoi(argv[1]);
    }

    // Initialize Database
    DatabaseManager db("datavault_db.json");

    // Static files root is the project frontend directory
    HttpServer::Server server(port, ".");

    // ================= 1. AUTH / LOGIN ENDPOINT =================
    server.addRoute("POST", "/api/login", [&](const HttpServer::Request& req) {
        auto jsonReq = SimpleJson::parse(req.body);
        std::string username = jsonReq.get("username").asString();
        std::string password = jsonReq.get("password").asString();

        auto resJson = SimpleJson::Value::object();

        // Check against users
        bool validUser = false;
        Models::User matchedUser;
        for (const auto& u : db.users) {
            if (u.username == username) {
                validUser = true;
                matchedUser = u;
                break;
            }
        }

        // Demo password check: 'admin123' or 'password'
        if (validUser && (password == "admin123" || password == "password" || username == "admin")) {
            resJson["success"] = true;
            resJson["message"] = "Authentication successful";
            resJson["user"] = matchedUser.toJson();
            return HttpServer::Response::json(resJson.serialize(), 200);
        } else {
            resJson["success"] = false;
            resJson["message"] = "Invalid username or password";
            return HttpServer::Response::json(resJson.serialize(), 401);
        }
    });

    // ================= 2. DASHBOARD STATS =================
    server.addRoute("GET", "/api/stats", [&](const HttpServer::Request&) {
        int allowed = 0;
        int denied = 0;
        for (const auto& l : db.logs) {
            if (l.result == "ALLOWED") allowed++;
            else if (l.result == "DENIED") denied++;
        }

        int activeAlerts = 0;
        for (const auto& a : db.alerts) {
            if (a.status == "ACTIVE") activeAlerts++;
        }

        auto resJson = SimpleJson::Value::object();
        resJson["success"] = true;
        auto stats = SimpleJson::Value::object();
        stats["totalUsers"] = static_cast<int>(db.users.size());
        stats["totalFiles"] = static_cast<int>(db.files.size());
        stats["totalAttempts"] = static_cast<int>(db.logs.size());
        stats["allowedAttempts"] = allowed;
        stats["deniedAttempts"] = denied;
        stats["totalAlerts"] = static_cast<int>(db.alerts.size());
        stats["activeAlerts"] = activeAlerts;
        resJson["stats"] = stats;

        return HttpServer::Response::json(resJson.serialize(), 200);
    });

    // ================= 3. USER MANAGEMENT APIS =================
    server.addRoute("GET", "/api/users", [&](const HttpServer::Request&) {
        auto resJson = SimpleJson::Value::object();
        resJson["success"] = true;
        auto arr = SimpleJson::Value::array();
        for (const auto& u : db.users) arr.push_back(u.toJson());
        resJson["users"] = arr;
        return HttpServer::Response::json(resJson.serialize(), 200);
    });

    server.addRoute("POST", "/api/users", [&](const HttpServer::Request& req) {
        auto jsonReq = SimpleJson::parse(req.body);
        Models::User u = Models::User::fromJson(jsonReq);

        if (u.username.empty()) {
            return HttpServer::Response::json("{\"success\":false,\"message\":\"Username cannot be blank\"}", 400);
        }

        // Verify username uniqueness
        for (const auto& existing : db.users) {
            if (existing.username == u.username) {
                return HttpServer::Response::json("{\"success\":false,\"message\":\"Username already exists\"}", 400);
            }
        }

        std::string newId = db.addUser(u);
        auto resJson = SimpleJson::Value::object();
        resJson["success"] = true;
        resJson["id"] = newId;
        resJson["message"] = "User created successfully";
        return HttpServer::Response::json(resJson.serialize(), 201);
    });

    server.addRoute("PUT", "/api/users/*", [&](const HttpServer::Request& req) {
        std::string id = extractIdFromPath(req.path, "/api/users/");
        auto jsonReq = SimpleJson::parse(req.body);
        Models::User u = Models::User::fromJson(jsonReq);
        bool ok = db.updateUser(id, u);

        auto resJson = SimpleJson::Value::object();
        resJson["success"] = ok;
        resJson["message"] = ok ? "User updated" : "User not found";
        return HttpServer::Response::json(resJson.serialize(), ok ? 200 : 404);
    });

    server.addRoute("DELETE", "/api/users/*", [&](const HttpServer::Request& req) {
        std::string id = extractIdFromPath(req.path, "/api/users/");
        bool ok = db.deleteUser(id);

        auto resJson = SimpleJson::Value::object();
        resJson["success"] = ok;
        resJson["message"] = ok ? "User removed" : "User not found";
        return HttpServer::Response::json(resJson.serialize(), ok ? 200 : 404);
    });

    // ================= 4. FILE MANAGEMENT APIS =================
    server.addRoute("GET", "/api/files", [&](const HttpServer::Request&) {
        auto resJson = SimpleJson::Value::object();
        resJson["success"] = true;
        auto arr = SimpleJson::Value::array();
        for (const auto& f : db.files) arr.push_back(f.toJson());
        resJson["files"] = arr;
        return HttpServer::Response::json(resJson.serialize(), 200);
    });

    server.addRoute("POST", "/api/files", [&](const HttpServer::Request& req) {
        auto jsonReq = SimpleJson::parse(req.body);
        Models::FileItem f = Models::FileItem::fromJson(jsonReq);

        if (f.filename.empty()) {
            return HttpServer::Response::json("{\"success\":false,\"message\":\"Filename is required\"}", 400);
        }

        for (const auto& existing : db.files) {
            if (existing.filename == f.filename) {
                return HttpServer::Response::json("{\"success\":false,\"message\":\"File already registered\"}", 400);
            }
        }

        std::string newId = db.addFile(f);
        auto resJson = SimpleJson::Value::object();
        resJson["success"] = true;
        resJson["id"] = newId;
        resJson["message"] = "File registered successfully";
        return HttpServer::Response::json(resJson.serialize(), 201);
    });

    server.addRoute("PUT", "/api/files/*", [&](const HttpServer::Request& req) {
        std::string id = extractIdFromPath(req.path, "/api/files/");
        auto jsonReq = SimpleJson::parse(req.body);
        Models::FileItem f = Models::FileItem::fromJson(jsonReq);
        bool ok = db.updateFile(id, f);

        auto resJson = SimpleJson::Value::object();
        resJson["success"] = ok;
        resJson["message"] = ok ? "File updated" : "File not found";
        return HttpServer::Response::json(resJson.serialize(), ok ? 200 : 404);
    });

    server.addRoute("DELETE", "/api/files/*", [&](const HttpServer::Request& req) {
        std::string id = extractIdFromPath(req.path, "/api/files/");
        bool ok = db.deleteFile(id);

        auto resJson = SimpleJson::Value::object();
        resJson["success"] = ok;
        resJson["message"] = ok ? "File unregistered" : "File not found";
        return HttpServer::Response::json(resJson.serialize(), ok ? 200 : 404);
    });

    // ================= 5. FILE PERMISSION APIS =================
    server.addRoute("GET", "/api/permissions", [&](const HttpServer::Request&) {
        auto resJson = SimpleJson::Value::object();
        resJson["success"] = true;
        auto arr = SimpleJson::Value::array();
        for (const auto& p : db.permissions) arr.push_back(p.toJson());
        resJson["permissions"] = arr;
        return HttpServer::Response::json(resJson.serialize(), 200);
    });

    server.addRoute("POST", "/api/permissions", [&](const HttpServer::Request& req) {
        auto jsonReq = SimpleJson::parse(req.body);
        Models::Permission p = Models::Permission::fromJson(jsonReq);

        if (p.username.empty() || p.filename.empty()) {
            return HttpServer::Response::json("{\"success\":false,\"message\":\"Username and filename required\"}", 400);
        }

        std::string id = db.addOrUpdatePermission(p);
        auto resJson = SimpleJson::Value::object();
        resJson["success"] = true;
        resJson["id"] = id;
        resJson["message"] = "Permission rule assigned";
        return HttpServer::Response::json(resJson.serialize(), 200);
    });

    server.addRoute("PUT", "/api/permissions/*", [&](const HttpServer::Request& req) {
        auto jsonReq = SimpleJson::parse(req.body);
        Models::Permission p = Models::Permission::fromJson(jsonReq);
        std::string id = db.addOrUpdatePermission(p);

        auto resJson = SimpleJson::Value::object();
        resJson["success"] = true;
        resJson["id"] = id;
        resJson["message"] = "Permission rule updated";
        return HttpServer::Response::json(resJson.serialize(), 200);
    });

    server.addRoute("DELETE", "/api/permissions/*", [&](const HttpServer::Request& req) {
        std::string id = extractIdFromPath(req.path, "/api/permissions/");
        bool ok = db.deletePermission(id);

        auto resJson = SimpleJson::Value::object();
        resJson["success"] = ok;
        resJson["message"] = ok ? "Permission rule revoked" : "Rule not found";
        return HttpServer::Response::json(resJson.serialize(), ok ? 200 : 404);
    });

    // ================= 6. ACCESS CHECK SIMULATOR ENGINE =================
    server.addRoute("POST", "/api/access/check", [&](const HttpServer::Request& req) {
        auto jsonReq = SimpleJson::parse(req.body);
        std::string username = jsonReq.get("username").asString();
        std::string filename = jsonReq.get("filename").asString();
        std::string action = jsonReq.get("action").asString("READ");
        std::string clientIp = jsonReq.get("clientIp").asString(req.clientIp);

        auto checkRes = db.checkAccess(username, filename, action, clientIp);

        auto resJson = SimpleJson::Value::object();
        resJson["success"] = true;
        resJson["allowed"] = checkRes.allowed;
        resJson["reason"] = checkRes.reason;
        resJson["username"] = username;
        resJson["filename"] = filename;
        resJson["action"] = action;
        resJson["clientIp"] = clientIp;
        resJson["consecutiveFailures"] = checkRes.consecutiveFailures;
        resJson["alertTriggered"] = checkRes.alertTriggered;
        resJson["alertId"] = checkRes.alertId;
        resJson["timestamp"] = DatabaseManager::getCurrentTimestamp();

        return HttpServer::Response::json(resJson.serialize(), 200);
    });

    // ================= 7. ACCESS AUDIT LOGS APIS =================
    server.addRoute("GET", "/api/logs", [&](const HttpServer::Request&) {
        auto resJson = SimpleJson::Value::object();
        resJson["success"] = true;
        auto arr = SimpleJson::Value::array();
        for (const auto& l : db.logs) arr.push_back(l.toJson());
        resJson["logs"] = arr;
        return HttpServer::Response::json(resJson.serialize(), 200);
    });

    server.addRoute("POST", "/api/logs/clear", [&](const HttpServer::Request&) {
        db.clearLogs();
        auto resJson = SimpleJson::Value::object();
        resJson["success"] = true;
        resJson["message"] = "Access logs ledger purged";
        return HttpServer::Response::json(resJson.serialize(), 200);
    });

    // ================= 8. SECURITY ALERTS APIS =================
    server.addRoute("GET", "/api/alerts", [&](const HttpServer::Request&) {
        auto resJson = SimpleJson::Value::object();
        resJson["success"] = true;
        auto arr = SimpleJson::Value::array();
        for (const auto& a : db.alerts) arr.push_back(a.toJson());
        resJson["alerts"] = arr;
        return HttpServer::Response::json(resJson.serialize(), 200);
    });

    server.addRoute("PUT", "/api/alerts/*/status", [&](const HttpServer::Request& req) {
        std::string path = req.path;
        size_t start = std::string("/api/alerts/").length();
        size_t end = path.find("/status");
        std::string alertId = (end != std::string::npos) ? path.substr(start, end - start) : "";

        auto jsonReq = SimpleJson::parse(req.body);
        std::string status = jsonReq.get("status").asString("ACTIVE");
        std::string notes = jsonReq.get("notes").asString();

        bool ok = db.updateAlertStatus(alertId, status, notes);

        auto resJson = SimpleJson::Value::object();
        resJson["success"] = ok;
        resJson["message"] = ok ? "Alert status updated" : "Alert not found";
        return HttpServer::Response::json(resJson.serialize(), ok ? 200 : 404);
    });

    server.addRoute("POST", "/api/alerts/clear", [&](const HttpServer::Request&) {
        db.clearAlerts();
        auto resJson = SimpleJson::Value::object();
        resJson["success"] = true;
        resJson["message"] = "All security alerts cleared and heuristics reset";
        return HttpServer::Response::json(resJson.serialize(), 200);
    });

    // Start server loop
    server.start();

    return 0;
}
