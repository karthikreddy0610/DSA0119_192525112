#include <iostream>
using namespace std;
int main() {
    int hour;
    cout << "Enter hour: ";
    cin >> hour;
    if ((hour >= 8 && hour < 10) || (hour >= 17 && hour < 20))
        cout << "Peak hour" << endl;
    else
        cout << "Off-peak hour" << endl;
}
