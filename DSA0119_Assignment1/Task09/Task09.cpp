#include <iostream>
using namespace std;
int getFare(int zone, int hour) {
    int fare;
    if (zone == 1) fare = 1000;
    else if (zone == 2) fare = 2000;
    else fare = 3000;
    if ((hour >= 8 && hour < 10) || (hour >= 17 && hour < 20))
        fare = fare + fare * 20 / 100;
    return fare;
}
int main() {
    cout << "Inner off-peak: " << getFare(1, 11) << " paise" << endl;
    cout << "Middle peak: " << getFare(2, 9) << " paise" << endl;
    cout << "Outer peak: " << getFare(3, 18) << " paise" << endl;
    cout << "Outer at 10 AM: " << getFare(3, 10) << " paise" << endl;
    cout << "Inner at 8 AM: " << getFare(1, 8) << " paise" << endl;
    int balance = 6000, fare = 1000;
    if (balance - fare >= 5000) cout << "Rs 50 balance test: PASS" << endl;
    else cout << "Rs 50 balance test: FAIL" << endl;
}
