#include <iostream>
#include <climits>
using namespace std;
int main() {
    int hour = 9;
    char zone = 'M';
    bool peak = true;
    long long balancePaise = 10000;
    double fare = 20.50;
    cout << "Hour: " << hour << endl;
    cout << "Zone: " << zone << endl;
    cout << "Peak: " << peak << endl;
    cout << "Balance: " << balancePaise << " paise" << endl;
    cout << "Fare: " << fare << endl;
    cout << "Size of int: " << sizeof(hour) << endl;
    cout << "Size of double: " << sizeof(fare) << endl;
    cout << "Maximum int: " << INT_MAX << endl;
}
