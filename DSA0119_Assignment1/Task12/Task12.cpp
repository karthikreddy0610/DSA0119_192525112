#include <iostream>
using namespace std;
int main() {
    int airportFare = 6000;
    int balance = 20000;
    bool weekend = true;
    bool peak = false;

    int fare = airportFare;
    if (weekend)
        fare = fare - fare * 10 / 100;
    else if (peak)
        fare = fare + fare * 20 / 100;

    cout << "Airport fare: " << fare << " paise" << endl;

    // Monthly pass covers Inner and Middle zones.
    bool monthlyPass = true;
    int zone = 1; // 1 = Inner, 2 = Middle, 3 = Outer, 4 = Airport
    if (monthlyPass && (zone == 1 || zone == 2)) {
        fare = 0;
        cout << "Monthly pass used" << endl;
    }

    if (balance - fare >= 5000) {
        balance = balance - fare;
        cout << "Journey allowed" << endl;
    } else cout << "Journey denied" << endl;

    cout << "Remaining balance: " << balance << " paise" << endl;
}
