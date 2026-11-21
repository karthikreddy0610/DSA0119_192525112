// CO5 Task B1: Polymorphic hospital billing and payer types
#include <iostream>
#include <memory>
#include <string>
#include <vector>
using namespace std;

class Bill {
protected:
    string patient;
public:
    explicit Bill(string p) : patient(p) {}
    virtual ~Bill() = default;
    virtual double total() const = 0;
    virtual string type() const { return "Bill"; }
    void print() const { cout << type() << " " << patient << ": " << total() << '\n'; }
};

class OutPatient : public Bill {
    double consultation, tests;
public:
    OutPatient(string p, double c, double t) : Bill(p), consultation(c), tests(t) {}
    double total() const override { return consultation + tests; }
    string type() const override { return "OP"; }
};

class InPatient : public Bill {
    int days;
    double perDay, surgery;
public:
    InPatient(string p, int d, double rate, double s)
        : Bill(p), days(d), perDay(rate), surgery(s) {}
    double total() const override { return days * perDay + surgery; }
    string type() const override { return "IP"; }
};

class DayCareBill : public Bill {
    double packagePrice;
public:
    DayCareBill(string p, double price) : Bill(p), packagePrice(price) {}
    double total() const override { return packagePrice; }
    string type() const override { return "DayCare"; }
};

class EmergencyBill : public Bill {
    double base, hourly;
    int hours;
public:
    EmergencyBill(string p, double b, int h, double rate)
        : Bill(p), base(b), hourly(rate), hours(h) {}
    double total() const override { return base + hours * hourly; }
    string type() const override { return "Emergency"; }
};

class Payer {
public:
    virtual double amountCovered(const Bill& bill) const = 0;
    virtual ~Payer() = default;
};

class SelfPay : public Payer {
public:
    double amountCovered(const Bill& bill) const override { return bill.total(); }
};

class Insurance : public Payer {
    double limit, coPayPercent;
public:
    Insurance(double l, double c) : limit(l), coPayPercent(c) {}
    double amountCovered(const Bill& bill) const override {
        double allowed = bill.total() * (100 - coPayPercent) / 100;
        return allowed < limit ? allowed : limit;
    }
};

class GovernmentScheme : public Payer {
    double packageRate;
public:
    GovernmentScheme(double r) : packageRate(r) {}
    double amountCovered(const Bill& bill) const override {
        return bill.total() < packageRate ? bill.total() : packageRate;
    }
};

int main() {
    vector<unique_ptr<Bill>> bills;
    bills.push_back(make_unique<OutPatient>("Ravi", 500, 1200));
    bills.push_back(make_unique<InPatient>("Meena", 3, 2500, 40000));
    bills.push_back(make_unique<DayCareBill>("John", 18000));
    bills.push_back(make_unique<EmergencyBill>("Sara", 2000, 3, 500));

    double grandTotal = 0;
    for (const auto& b : bills) {
        b->print();
        grandTotal += b->total();
    }
    cout << "Total " << grandTotal << '\n';

    SelfPay self;
    Insurance insurance(30000, 10);
    GovernmentScheme scheme(15000);
    cout << "Self pay: " << self.amountCovered(*bills[0]) << '\n';
    cout << "Insurance: " << insurance.amountCovered(*bills[1]) << '\n';
    cout << "Government: " << scheme.amountCovered(*bills[2]) << '\n';
    return 0;
}
