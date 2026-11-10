#include <iostream>
using namespace std;
bool canTravel(int balance, int fare) {
    return balance - fare >= 5000;
}
int main() {
    int balance = 10000, fare = 3000;
    if (canTravel(balance, fare)) {
        balance = balance - fare;
        cout << "Journey allowed" << endl;
    } else cout << "Journey denied" << endl;
    cout << "Balance: " << balance / 100 << " rupees" << endl;
}
