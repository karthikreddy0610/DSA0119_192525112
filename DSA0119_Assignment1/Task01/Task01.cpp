#include <iostream>
using namespace std;
class SmartCard {
public:
    int balance;
    void showBalance() { cout << "Balance: Rs " << balance << endl; }
};
int main() {
    SmartCard card;
    card.balance = 100;
    card.showBalance();
}
