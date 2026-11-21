// CO4 Task 1: Reusable payroll class hierarchy
#include <iostream>
#include <string>
#include <vector>
using namespace std;

class Staff {
protected:
    string name;
    int id;
    double basic;

public:
    Staff(string n, int i, double b) : name(n), id(i), basic(b) {}
    virtual double pay() const = 0;
    virtual void print() const {
        cout << name << " (" << id << ") pay = " << pay() << '\n';
    }
    virtual ~Staff() = default;
};

class Professor : public Staff {
    double research;
public:
    Professor(string n, int i, double b, double r)
        : Staff(n, i, b), research(r) {}
    double pay() const override { return basic + basic * 0.42 + research; }
};

class LabAssistant : public Staff {
public:
    LabAssistant(string n, int i, double b) : Staff(n, i, b) {}
    double pay() const override { return basic + basic * 0.42; }
};

class GuestFaculty : public Staff {
    double hours, rate;
public:
    GuestFaculty(string n, int i, double h, double r)
        : Staff(n, i, 0), hours(h), rate(r) {}
    double pay() const override { return hours * rate; }
};

int main() {
    vector<Staff*> people;
    people.push_back(new Professor("Anu", 101, 50000, 5000));
    people.push_back(new LabAssistant("Ravi", 102, 30000));
    people.push_back(new GuestFaculty("Meena", 103, 20, 1000));

    for (Staff* s : people) s->print();
    for (Staff* s : people) delete s;
    return 0;
}
