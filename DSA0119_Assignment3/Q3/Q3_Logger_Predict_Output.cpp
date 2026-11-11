#include <iostream>
#include <string>
using namespace std;

struct Logger {
    string name;

    Logger(string s) : name(s) {
        cout << "+" << name << " ";
    }

    Logger(const Logger &other) : name(other.name + "c") {
        cout << "copy" << name << " ";
    }

    ~Logger() {
        cout << "-" << name << " ";
    }
};

void use(Logger x) {
    cout << "use ";
}

int main() {
    Logger a("A");

    {
        Logger b("B");
    }

    use(a);

    Logger *p = new Logger("P");
    delete p;

    cout << "end ";
    return 0;
}
