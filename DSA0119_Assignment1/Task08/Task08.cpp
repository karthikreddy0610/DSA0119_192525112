#include <iostream>
#include <iomanip>
using namespace std;
int main() {
    int hour, balance;
    cout << "Enter hour: ";
    cin >> hour;
    if (cin.fail()) {
        cout << "Invalid hour" << endl;
        return 0;
    }
    cout << "Enter balance in paise: ";
    cin >> balance;
    if (cin.fail() || balance < 0) {
        cout << "Invalid balance" << endl;
        return 0;
    }
    cout << "Hour: " << hour << endl;
    cout << fixed << setprecision(2);
    cout << "Balance: Rs " << balance / 100.0 << endl;
}
