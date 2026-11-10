#include <iostream>
using namespace std;
class SmartCard {
private:
    int balance;
public:
    SmartCard() { balance = 10000; }
    bool canTravel(int fare) { return balance - fare >= 5000; }
    void deduct(int fare) {
        if (canTravel(fare)) {
            balance = balance - fare;
            cout << "Journey allowed" << endl;
        } else cout << "Journey denied" << endl;
    }
    void showBalance() { cout << "Balance: " << balance / 100 << " rupees" << endl; }
};
int main() {
    SmartCard card;
    card.deduct(3000);
    card.showBalance();
}
