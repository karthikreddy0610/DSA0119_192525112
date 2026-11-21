// CO5 Task B4: Extend the billing design with a new bill and payer
#include <iostream>
#include <memory>
#include <stdexcept>
#include <string>
#include <vector>
using namespace std;

class Bill {
protected:
    string patient;
public:
    explicit Bill(string p) : patient(p) {}
    virtual double total() const = 0;
    virtual string type() const = 0;
    virtual ~Bill() = default;
};

class OutPatientBill : public Bill {
    double consultation, tests;
public:
    OutPatientBill(string p, double c, double t)
        : Bill(p), consultation(c), tests(t) {}
    double total() const override { return consultation + tests; }
    string type() const override { return "OutPatient"; }
};

class InPatientBill : public Bill {
    double room, procedure;
public:
    InPatientBill(string p, double r, double pr)
        : Bill(p), room(r), procedure(pr) {}
    double total() const override { return room + procedure; }
    string type() const override { return "InPatient"; }
};

// New bill type: added without modifying old bill classes
class CorporateBill : public Bill {
    double amount;
public:
    CorporateBill(string p, double a) : Bill(p), amount(a) {}
    double total() const override { return amount; }
    string type() const override { return "Corporate"; }
};

class Payer {
public:
    virtual double amountCovered(const Bill& b) const = 0;
    virtual ~Payer() = default;
};

class SelfPay : public Payer {
public:
    double amountCovered(const Bill& b) const override { return b.total(); }
};

class CorporatePayer : public Payer {
    double percentage;
public:
    explicit CorporatePayer(double p) : percentage(p) {}
    double amountCovered(const Bill& b) const override {
        return b.total() * percentage / 100;
    }
};

int main() {
    vector<unique_ptr<Bill>> bills;
    bills.push_back(make_unique<OutPatientBill>("Ravi", 500, 1200));
    bills.push_back(make_unique<InPatientBill>("Meena", 20000, 15000));
    bills.push_back(make_unique<CorporateBill>("Arun", 50000));

    SelfPay self;
    CorporatePayer company(80);
    for (const auto& b : bills) {
        cout << b->type() << " total = " << b->total() << '\n';
        cout << "Self pay covers = " << self.amountCovered(*b) << '\n';
        cout << "Corporate payer covers = " << company.amountCovered(*b) << '\n';
    }

    try {
        throw runtime_error("sample billing error");
    } catch (const exception& e) {
        cout << "Handled safely: " << e.what() << '\n';
    }
    return 0;
}
