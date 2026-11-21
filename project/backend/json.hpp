#pragma once

#include <string>
#include <vector>
#include <map>
#include <sstream>
#include <iostream>
#include <algorithm>
#include <cctype>

namespace SimpleJson {

enum class Type {
    Null,
    Boolean,
    Number,
    String,
    Array,
    Object
};

class Value {
public:
    Type type = Type::Null;
    bool boolVal = false;
    double numVal = 0.0;
    std::string strVal;
    std::vector<Value> arrVal;
    std::map<std::string, Value> objVal;

    Value() : type(Type::Null) {}
    Value(bool b) : type(Type::Boolean), boolVal(b) {}
    Value(int n) : type(Type::Number), numVal(static_cast<double>(n)) {}
    Value(long n) : type(Type::Number), numVal(static_cast<double>(n)) {}
    Value(long long n) : type(Type::Number), numVal(static_cast<double>(n)) {}
    Value(double n) : type(Type::Number), numVal(n) {}
    Value(const char* s) : type(Type::String), strVal(s ? s : "") {}
    Value(const std::string& s) : type(Type::String), strVal(s) {}

    static Value object() {
        Value v;
        v.type = Type::Object;
        return v;
    }

    static Value array() {
        Value v;
        v.type = Type::Array;
        return v;
    }

    bool isObject() const { return type == Type::Object; }
    bool isArray() const { return type == Type::Array; }
    bool isString() const { return type == Type::String; }
    bool isNumber() const { return type == Type::Number; }
    bool isBool() const { return type == Type::Boolean; }
    bool isNull() const { return type == Type::Null; }

    std::string asString(const std::string& defaultVal = "") const {
        if (type == Type::String) return strVal;
        if (type == Type::Number) {
            std::ostringstream ss;
            ss << numVal;
            return ss.str();
        }
        if (type == Type::Boolean) return boolVal ? "true" : "false";
        return defaultVal;
    }

    int asInt(int defaultVal = 0) const {
        if (type == Type::Number) return static_cast<int>(numVal);
        if (type == Type::String) {
            try { return std::stoi(strVal); } catch (...) { return defaultVal; }
        }
        return defaultVal;
    }

    bool asBool(bool defaultVal = false) const {
        if (type == Type::Boolean) return boolVal;
        if (type == Type::String) return strVal == "true" || strVal == "1";
        if (type == Type::Number) return numVal != 0.0;
        return defaultVal;
    }

    Value& operator[](const std::string& key) {
        if (type != Type::Object) {
            type = Type::Object;
            objVal.clear();
        }
        return objVal[key];
    }

    const Value& get(const std::string& key) const {
        static Value nullVal;
        if (type == Type::Object) {
            auto it = objVal.find(key);
            if (it != objVal.end()) return it->second;
        }
        return nullVal;
    }

    bool has(const std::string& key) const {
        if (type != Type::Object) return false;
        return objVal.find(key) != objVal.end();
    }

    void push_back(const Value& val) {
        if (type != Type::Array) {
            type = Type::Array;
            arrVal.clear();
        }
        arrVal.push_back(val);
    }

    size_t size() const {
        if (type == Type::Array) return arrVal.size();
        if (type == Type::Object) return objVal.size();
        return 0;
    }

    std::string serialize() const {
        std::ostringstream ss;
        serializeInternal(ss);
        return ss.str();
    }

private:
    static void escapeString(const std::string& s, std::ostream& os) {
        os << '"';
        for (char c : s) {
            switch (c) {
                case '"': os << "\\\""; break;
                case '\\': os << "\\\\"; break;
                case '\b': os << "\\b"; break;
                case '\f': os << "\\f"; break;
                case '\n': os << "\\n"; break;
                case '\r': os << "\\r"; break;
                case '\t': os << "\\t"; break;
                default:
                    if (static_cast<unsigned char>(c) < 0x20) {
                        char buf[8];
                        snprintf(buf, sizeof(buf), "\\u%04x", (int)(unsigned char)c);
                        os << buf;
                    } else {
                        os << c;
                    }
                    break;
            }
        }
        os << '"';
    }

    void serializeInternal(std::ostream& os) const {
        switch (type) {
            case Type::Null: os << "null"; break;
            case Type::Boolean: os << (boolVal ? "true" : "false"); break;
            case Type::Number: {
                if (numVal == static_cast<long long>(numVal)) {
                    os << static_cast<long long>(numVal);
                } else {
                    os << numVal;
                }
                break;
            }
            case Type::String: escapeString(strVal, os); break;
            case Type::Array: {
                os << '[';
                for (size_t i = 0; i < arrVal.size(); ++i) {
                    if (i > 0) os << ',';
                    arrVal[i].serializeInternal(os);
                }
                os << ']';
                break;
            }
            case Type::Object: {
                os << '{';
                bool first = true;
                for (const auto& pair : objVal) {
                    if (!first) os << ',';
                    first = false;
                    escapeString(pair.first, os);
                    os << ':';
                    pair.second.serializeInternal(os);
                }
                os << '}';
                break;
            }
        }
    }
};

class Parser {
    const std::string& str;
    size_t pos;

    void skipWhitespace() {
        while (pos < str.size() && (str[pos] == ' ' || str[pos] == '\t' || str[pos] == '\n' || str[pos] == '\r')) {
            pos++;
        }
    }

    char peek() {
        skipWhitespace();
        if (pos >= str.size()) return '\0';
        return str[pos];
    }

    char get() {
        skipWhitespace();
        if (pos >= str.size()) return '\0';
        return str[pos++];
    }

public:
    Parser(const std::string& s) : str(s), pos(0) {}

    Value parse() {
        skipWhitespace();
        if (pos >= str.size()) return Value();
        char c = peek();
        if (c == '{') return parseObject();
        if (c == '[') return parseArray();
        if (c == '"') return parseString();
        if (c == 't' || c == 'f') return parseBool();
        if (c == 'n') return parseNull();
        if (c == '-' || (c >= '0' && c <= '9')) return parseNumber();
        return Value();
    }

private:
    Value parseObject() {
        Value val = Value::object();
        get(); // '{'
        while (true) {
            char c = peek();
            if (c == '}' || c == '\0') {
                if (c == '}') get();
                break;
            }
            Value key = parseString();
            skipWhitespace();
            if (get() != ':') break;
            Value v = parse();
            val[key.strVal] = v;
            c = peek();
            if (c == ',') {
                get();
            } else if (c == '}') {
                get();
                break;
            } else {
                break;
            }
        }
        return val;
    }

    Value parseArray() {
        Value val = Value::array();
        get(); // '['
        while (true) {
            char c = peek();
            if (c == ']' || c == '\0') {
                if (c == ']') get();
                break;
            }
            val.push_back(parse());
            c = peek();
            if (c == ',') {
                get();
            } else if (c == ']') {
                get();
                break;
            } else {
                break;
            }
        }
        return val;
    }

    Value parseString() {
        get(); // '"'
        std::string res;
        while (pos < str.size()) {
            char c = str[pos++];
            if (c == '"') {
                break;
            } else if (c == '\\' && pos < str.size()) {
                char esc = str[pos++];
                switch (esc) {
                    case '"': res += '"'; break;
                    case '\\': res += '\\'; break;
                    case '/': res += '/'; break;
                    case 'b': res += '\b'; break;
                    case 'f': res += '\f'; break;
                    case 'n': res += '\n'; break;
                    case 'r': res += '\r'; break;
                    case 't': res += '\t'; break;
                    case 'u': {
                        if (pos + 4 <= str.size()) {
                            pos += 4; // Skip hex unicode for simple parser
                            res += '?';
                        }
                        break;
                    }
                    default: res += esc; break;
                }
            } else {
                res += c;
            }
        }
        return Value(res);
    }

    Value parseNumber() {
        size_t start = pos;
        if (pos < str.size() && (str[pos] == '-' || str[pos] == '+')) pos++;
        while (pos < str.size() && ((str[pos] >= '0' && str[pos] <= '9') || str[pos] == '.' || str[pos] == 'e' || str[pos] == 'E' || str[pos] == '-' || str[pos] == '+')) {
            pos++;
        }
        std::string numStr = str.substr(start, pos - start);
        try {
            double d = std::stod(numStr);
            return Value(d);
        } catch (...) {
            return Value(0.0);
        }
    }

    Value parseBool() {
        if (str.substr(pos, 4) == "true") {
            pos += 4;
            return Value(true);
        } else if (str.substr(pos, 5) == "false") {
            pos += 5;
            return Value(false);
        }
        return Value(false);
    }

    Value parseNull() {
        if (str.substr(pos, 4) == "null") pos += 4;
        return Value();
    }
};

inline Value parse(const std::string& json) {
    Parser p(json);
    return p.parse();
}

} // namespace SimpleJson
