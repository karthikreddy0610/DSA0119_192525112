// CO5 Task B3: Compare virtual calls, switch and exception/return-code validation
#include <chrono>
#include <iostream>
#include <stdexcept>
#include <vector>
using namespace std;
using Clock = chrono::steady_clock;

class Bill {
public:
    virtual double total() const = 0;
    virtual ~Bill() = default;
};
class OPBill : public Bill {
    double a, b;
public:
    OPBill(double x, double y) : a(x), b(y) {}
    double total() const override { return a + b; }
};
class IPBill : public Bill {
    double amount;
public:
    explicit IPBill(double x) : amount(x) {}
    double total() const override { return amount; }
};

struct SimpleBill {
    int type;
    double first, second;
};
double switchTotal(const SimpleBill& b) {
    switch (b.type) {
        case 0: return b.first + b.second;
        case 1: return b.first;
        default: return 0;
    }
}

bool validByCode(double x) { return x >= 0 && x <= 1000000; }
void validByException(double x) {
    if (x < 0) throw invalid_argument("negative");
    if (x > 1000000) throw out_of_range("large");
}

template<class Function>
long long measure(Function fn) {
    auto start = Clock::now();
    volatile int accepted = 0;
    for (int i = 0; i < 1000000; ++i) accepted += fn(i);
    auto stop = Clock::now();
    (void)accepted;
    return chrono::duration_cast<chrono::milliseconds>(stop - start).count();
}

int main() {
    vector<Bill*> virtualBills;
    vector<SimpleBill> simpleBills;
    for (int i = 0; i < 10; ++i) {
        virtualBills.push_back(i % 2 == 0
            ? static_cast<Bill*>(new OPBill(100 + i, 50))
            : static_cast<Bill*>(new IPBill(200 + i)));
        simpleBills.push_back({i % 2, 100.0 + i, i % 2 == 0 ? 50.0 : 0.0});
    }

    double virtualSum = 0, switchSum = 0;
    for (Bill* b : virtualBills) virtualSum += b->total();
    for (const auto& b : simpleBills) switchSum += switchTotal(b);
    cout << "Virtual total: " << virtualSum << '\n';
    cout << "Switch total: " << switchSum << '\n';

    for (Bill* b : virtualBills) delete b;

    cout << "Return-code 1M time (ms): "
         << measure([](int i) { return validByCode(i % 1000001) ? 1 : 0; }) << '\n';
    cout << "Exception 1M time (ms): "
         << measure([](int i) {
                try { validByException(i % 1000001); return 1; }
                catch (const exception&) { return 0; }
            }) << '\n';
    cout << "Timing varies by computer and compiler.\n";
    return 0;
}
