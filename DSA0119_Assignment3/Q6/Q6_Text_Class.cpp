#include <iostream>
#include <cstring>
using namespace std;

class Text {
private:
    char *data;

public:
    Text(const char *s = "") {
        data = new char[strlen(s) + 1];
        strcpy(data, s);
    }

    Text(const Text &other) {
        data = new char[strlen(other.data) + 1];
        strcpy(data, other.data);
    }

    Text& operator=(const Text &other) {
        if (this != &other) {
            delete[] data;
            data = new char[strlen(other.data) + 1];
            strcpy(data, other.data);
        }
        return *this;
    }

    ~Text() {
        delete[] data;
    }

    Text operator+(const Text &other) {
        char *temp = new char[strlen(data) + strlen(other.data) + 1];
        strcpy(temp, data);
        strcat(temp, other.data);

        Text result(temp);
        delete[] temp;
        return result;
    }

    bool operator==(const Text &other) const {
        return strcmp(data, other.data) == 0;
    }

    bool operator!=(const Text &other) const {
        return !(*this == other);
    }

    friend ostream& operator<<(ostream &out, const Text &t) {
        out << t.data;
        return out;
    }
};

int main() {
    Text a("Hello ");
    Text b("World");
    Text c = a + b;

    cout << c << endl;
    cout << boolalpha << (a == b) << endl;
    cout << (a != b) << endl;

    a = a; // Self-assignment test
    cout << a << endl;

    return 0;
}
