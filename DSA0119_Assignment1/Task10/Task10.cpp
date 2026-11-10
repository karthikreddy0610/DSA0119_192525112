#include <iostream>
using namespace std;
int main() {
    int farePaise = 3600;
    int journeys[] = {20000, 500000, 3000000};
    for (int i = 0; i < 3; i++) {
        long long total = (long long)farePaise * journeys[i];
        cout << journeys[i] << " journeys: " << total << " paise" << endl;
    }
    double totalRupees = 36.00 * 3000000;
    cout << "Double total: Rs " << totalRupees << endl;
}
