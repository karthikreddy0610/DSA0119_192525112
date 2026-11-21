#pragma once

#include <string>
#include <vector>
#include <map>
#include <sstream>
#include <iostream>
#include <fstream>
#include <thread>
#include <functional>
#include <algorithm>

#if defined(_WIN32) || defined(_WIN64)
#include <winsock2.h>
#include <ws2tcpip.h>
#pragma comment(lib, "ws2_32.lib")
typedef int socklen_t;
#else
#include <sys/types.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <unistd.h>
#define SOCKET int
#define INVALID_SOCKET -1
#define SOCKET_ERROR -1
#define closesocket close
#endif

namespace HttpServer {

struct Request {
    std::string method;
    std::string path;
    std::map<std::string, std::string> headers;
    std::string body;
    std::string clientIp;
};

struct Response {
    int statusCode = 200;
    std::string statusText = "OK";
    std::string contentType = "application/json";
    std::string body;
    std::map<std::string, std::string> customHeaders;

    static Response json(const std::string& jsonBody, int code = 200) {
        Response r;
        r.statusCode = code;
        r.statusText = (code == 200) ? "OK" : (code == 201) ? "Created" : (code == 400) ? "Bad Request" : (code == 404) ? "Not Found" : "Internal Server Error";
        r.contentType = "application/json; charset=utf-8";
        r.body = jsonBody;
        return r;
    }

    static Response text(const std::string& textBody, int code = 200) {
        Response r;
        r.statusCode = code;
        r.statusText = "OK";
        r.contentType = "text/plain; charset=utf-8";
        r.body = textBody;
        return r;
    }

    static Response file(const std::string& fileContent, const std::string& mimeType) {
        Response r;
        r.statusCode = 200;
        r.statusText = "OK";
        r.contentType = mimeType;
        r.body = fileContent;
        return r;
    }

    static Response notFound(const std::string& msg = "Not Found") {
        Response r;
        r.statusCode = 404;
        r.statusText = "Not Found";
        r.contentType = "application/json";
        r.body = "{\"success\":false,\"error\":\"" + msg + "\"}";
        return r;
    }
};

using HandlerFunc = std::function<Response(const Request&)>;

class Server {
private:
    int port;
    std::string staticDir;
    SOCKET listenSocket = INVALID_SOCKET;
    bool running = false;
    std::vector<std::pair<std::string, std::pair<std::string, HandlerFunc>>> routes; // method, path, handler

    static std::string getMimeType(const std::string& path) {
        size_t dot = path.find_last_of('.');
        if (dot == std::string::npos) return "text/plain";
        std::string ext = path.substr(dot);
        std::transform(ext.begin(), ext.end(), ext.begin(), ::tolower);

        if (ext == ".html" || ext == ".htm") return "text/html; charset=utf-8";
        if (ext == ".css") return "text/css; charset=utf-8";
        if (ext == ".js") return "application/javascript; charset=utf-8";
        if (ext == ".json") return "application/json; charset=utf-8";
        if (ext == ".png") return "image/png";
        if (ext == ".jpg" || ext == ".jpeg") return "image/jpeg";
        if (ext == ".gif") return "image/gif";
        if (ext == ".svg") return "image/svg+xml";
        if (ext == ".ico") return "image/x-icon";
        if (ext == ".woff2") return "font/woff2";
        if (ext == ".woff") return "font/woff";
        if (ext == ".ttf") return "font/ttf";
        return "application/octet-stream";
    }

public:
    Server(int p, const std::string& staticRoot = ".") : port(p), staticDir(staticRoot) {
#if defined(_WIN32) || defined(_WIN64)
        WSADATA wsaData;
        WSAStartup(MAKEWORD(2, 2), &wsaData);
#endif
    }

    ~Server() {
        stop();
#if defined(_WIN32) || defined(_WIN64)
        WSACleanup();
#endif
    }

    void addRoute(const std::string& method, const std::string& path, HandlerFunc handler) {
        routes.push_back({ method, { path, handler } });
    }

    void start() {
        listenSocket = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
        if (listenSocket == INVALID_SOCKET) {
            std::cerr << "[HttpServer] Failed to create socket\n";
            return;
        }

        int opt = 1;
        setsockopt(listenSocket, SOL_SOCKET, SO_REUSEADDR, (const char*)&opt, sizeof(opt));

        sockaddr_in serverAddr{};
        serverAddr.sin_family = AF_INET;
        serverAddr.sin_addr.s_addr = INADDR_ANY;
        serverAddr.sin_port = htons(port);

        if (bind(listenSocket, (sockaddr*)&serverAddr, sizeof(serverAddr)) == SOCKET_ERROR) {
            std::cerr << "[HttpServer] Bind failed on port " << port << "\n";
            closesocket(listenSocket);
            return;
        }

        if (listen(listenSocket, SOMAXCONN) == SOCKET_ERROR) {
            std::cerr << "[HttpServer] Listen failed\n";
            closesocket(listenSocket);
            return;
        }

        running = true;
        std::cout << "========================================================\n";
        std::cout << "  DataVault C++ Engine Live on http://localhost:" << port << "\n";
        std::cout << "  Serving Frontend Static Files & REST API Endpoints\n";
        std::cout << "========================================================\n";

        while (running) {
            sockaddr_in clientAddr{};
            socklen_t clientLen = sizeof(clientAddr);
            SOCKET clientSocket = accept(listenSocket, (sockaddr*)&clientAddr, &clientLen);

            if (clientSocket == INVALID_SOCKET) {
                if (!running) break;
                continue;
            }

            char clientIpBuf[INET_ADDRSTRLEN];
            inet_ntop(AF_INET, &(clientAddr.sin_addr), clientIpBuf, INET_ADDRSTRLEN);
            std::string clientIp = clientIpBuf;

            std::thread([this, clientSocket, clientIp]() {
                this->handleClient(clientSocket, clientIp);
            }).detach();
        }
    }

    void stop() {
        running = false;
        if (listenSocket != INVALID_SOCKET) {
            closesocket(listenSocket);
            listenSocket = INVALID_SOCKET;
        }
    }

private:
    void handleClient(SOCKET clientSocket, const std::string& clientIp) {
        char buffer[8192];
        std::string rawRequest;
        int bytesRead = 0;

        // Read headers
        while ((bytesRead = recv(clientSocket, buffer, sizeof(buffer) - 1, 0)) > 0) {
            buffer[bytesRead] = '\0';
            rawRequest.append(buffer, bytesRead);
            if (rawRequest.find("\r\n\r\n") != std::string::npos) {
                break;
            }
        }

        if (rawRequest.empty()) {
            closesocket(clientSocket);
            return;
        }

        size_t headerEnd = rawRequest.find("\r\n\r\n");
        std::string headerPart = rawRequest.substr(0, headerEnd);
        std::string bodyPart = (headerEnd != std::string::npos) ? rawRequest.substr(headerEnd + 4) : "";

        std::istringstream stream(headerPart);
        std::string reqLine;
        std::getline(stream, reqLine);
        if (!reqLine.empty() && reqLine.back() == '\r') reqLine.pop_back();

        std::istringstream lineStream(reqLine);
        std::string method, fullPath, httpVer;
        lineStream >> method >> fullPath >> httpVer;

        std::string path = fullPath;
        size_t qPos = path.find('?');
        if (qPos != std::string::npos) path = path.substr(0, qPos);

        std::map<std::string, std::string> headers;
        std::string hLine;
        size_t contentLength = 0;

        while (std::getline(stream, hLine)) {
            if (!hLine.empty() && hLine.back() == '\r') hLine.pop_back();
            if (hLine.empty()) continue;
            size_t colon = hLine.find(':');
            if (colon != std::string::npos) {
                std::string k = hLine.substr(0, colon);
                std::string v = hLine.substr(colon + 1);
                // trim
                while (!v.empty() && v.front() == ' ') v.erase(0, 1);
                std::string lowerK = k;
                std::transform(lowerK.begin(), lowerK.end(), lowerK.begin(), ::tolower);
                headers[lowerK] = v;
                if (lowerK == "content-length") {
                    try { contentLength = std::stoul(v); } catch (...) {}
                }
            }
        }

        // Read remaining body if Content-Length exceeds what was received
        while (bodyPart.size() < contentLength) {
            int toRead = static_cast<int>(std::min(sizeof(buffer) - 1, contentLength - bodyPart.size()));
            bytesRead = recv(clientSocket, buffer, toRead, 0);
            if (bytesRead <= 0) break;
            buffer[bytesRead] = '\0';
            bodyPart.append(buffer, bytesRead);
        }

        Request req;
        req.method = method;
        req.path = path;
        req.headers = headers;
        req.body = bodyPart;
        req.clientIp = clientIp;

        Response res;

        // Handle CORS Preflight OPTIONS
        if (method == "OPTIONS") {
            res.statusCode = 204;
            res.statusText = "No Content";
            res.contentType = "text/plain";
            sendResponse(clientSocket, res);
            closesocket(clientSocket);
            return;
        }

        // Try API routes first
        bool matched = false;
        for (const auto& r : routes) {
            const std::string& rMethod = r.first;
            const std::string& rPath = r.second.first;

            if (rMethod == method) {
                // Exact match or prefix match with wildcard
                if (rPath == path || matchPrefix(rPath, path)) {
                    res = r.second.second(req);
                    matched = true;
                    break;
                }
            }
        }

        // If no API route, try serving static file from frontend directory
        if (!matched) {
            if (method == "GET") {
                res = serveStaticFile(path);
            } else {
                res = Response::notFound("Route not found");
            }
        }

        sendResponse(clientSocket, res);
        closesocket(clientSocket);
    }

    bool matchPrefix(const std::string& pattern, const std::string& actual) {
        if (pattern.empty() || actual.empty()) return false;
        if (pattern.back() == '*') {
            std::string prefix = pattern.substr(0, pattern.size() - 1);
            return actual.rfind(prefix, 0) == 0;
        }
        return false;
    }

    Response serveStaticFile(std::string path) {
        if (path == "/" || path.empty()) path = "/index.html";

        // Security check against directory traversal
        if (path.find("..") != std::string::npos) {
            return Response::notFound("Access forbidden");
        }

        std::string fullFilePath = staticDir + path;
        std::ifstream file(fullFilePath, std::ios::binary);
        if (!file.is_open()) {
            // Fallback for single page app routing
            fullFilePath = staticDir + "/index.html";
            file.open(fullFilePath, std::ios::binary);
            if (!file.is_open()) {
                return Response::notFound("File not found");
            }
            path = "/index.html";
        }

        std::string content((std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>());
        file.close();

        return Response::file(content, getMimeType(path));
    }

    void sendResponse(SOCKET clientSocket, const Response& res) {
        std::ostringstream ss;
        ss << "HTTP/1.1 " << res.statusCode << " " << res.statusText << "\r\n";
        ss << "Content-Type: " << res.contentType << "\r\n";
        ss << "Content-Length: " << res.body.size() << "\r\n";
        ss << "Access-Control-Allow-Origin: *\r\n";
        ss << "Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS\r\n";
        ss << "Access-Control-Allow-Headers: Content-Type, Authorization\r\n";
        ss << "Connection: close\r\n";

        for (const auto& h : res.customHeaders) {
            ss << h.first << ": " << h.second << "\r\n";
        }
        ss << "\r\n";

        std::string headersStr = ss.str();
        send(clientSocket, headersStr.c_str(), static_cast<int>(headersStr.size()), 0);
        if (!res.body.empty()) {
            send(clientSocket, res.body.c_str(), static_cast<int>(res.body.size()), 0);
        }
    }
};

} // namespace HttpServer
