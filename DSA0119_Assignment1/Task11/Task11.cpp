#include <iostream>
using namespace std;
const int INNER = 1000, MIDDLE = 2000, OUTER = 3000;
const int MIN_BALANCE = 5000;
int main() {
    int balance = 10000;
    int fare = OUTER;
    int hour = 18;
    if ((hour >= 8 && hour < 10) || (hour >= 17 && hour < 20))
        fare = fare + fare * 20 / 100;
    if (balance - fare >= MIN_BALANCE) {
        balance = balance - fare;
        cout << "Journey allowed" << endl;
    } else cout << "Journey denied" << endl;
    cout << "Fare: " << fare << " paise" << endl;
    cout << "Balance: " << balance << " paise" << endl;
}
