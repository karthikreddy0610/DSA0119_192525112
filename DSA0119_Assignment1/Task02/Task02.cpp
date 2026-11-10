#include <iostream>
using namespace std;
const int INNER = 10, MIDDLE = 20, OUTER = 30;
enum Zone { IN, MID, OUT };
int main() {
    Zone z = MID;
    int fare;
    if (z == IN) fare = INNER;
    else if (z == MID) fare = MIDDLE;
    else fare = OUTER;
    cout << "Fare: Rs " << fare << endl;
}
