#include <iostream>
#include <string>
using namespace std;
int main() {
    string input;
    cout << "Enter hour: ";
    getline(cin, input);
    try {
        int hour = stoi(input);
        cout << "Hour: " << hour << endl;
    } catch (...) {
        cout << "Invalid input" << endl;
    }
}
