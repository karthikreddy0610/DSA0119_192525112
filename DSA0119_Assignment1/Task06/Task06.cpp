#include <iostream>
#include <iomanip>
using namespace std;
enum Zone { INNER, MIDDLE, OUTER };
int fare(Zone z, bool peak) {
    int amount = 0;
    switch (z) {
        case INNER: amount = 1000; break;
        case MIDDLE: amount = 2000; break;
        case OUTER: amount = 3000; break;
    }
    if (peak) amount = amount + amount * 20 / 100;
    return amount;
}
bool canTravel(int balance, int f) {
    return balance - f >= 5000;
}
int main() {
    int balance = 10000;
    Zone zones[] = {INNER, OUTER, MIDDLE};
    bool peaks[] = {false, true, false};
    for (int i = 0; i < 3; i++) {
        int f = fare(zones[i], peaks[i]);
        if (canTravel(balance, f)) {
            balance = balance - f;
            cout << "Fare Rs " << f / 100 << "." << setw(2)
                 << setfill('0') << f % 100 << setfill(' ');
        } else cout << "Denied (low balance)";
        cout << " balance Rs " << balance / 100 << endl;
    }
}
