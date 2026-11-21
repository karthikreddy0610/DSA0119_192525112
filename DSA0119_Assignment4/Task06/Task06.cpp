// CO4 Task 6: Extensible vehicle rental fleet
#include <iostream>
#include <memory>
#include <string>
#include <vector>
using namespace std;

class Vehicle {
protected:
    string regNo;
    double dailyRate;
    bool rented = false;
public:
    Vehicle(string r, double rate) : regNo(r), dailyRate(rate) {}
    virtual double charge(int days) const = 0;
    virtual string type() const = 0;
    void rent() { rented = true; }
    void giveBack() { rented = false; }
    void print(int days) const {
        cout << type() << " " << regNo << " charge = " << charge(days) << '\n';
    }
    virtual ~Vehicle() = default;
};

class Bicycle : public Vehicle {
public:
    Bicycle(string r, double rate) : Vehicle(r, rate) {}
    double charge(int days) const override { return dailyRate * days; }
    string type() const override { return "Bicycle"; }
};

class TwoWheeler : public Vehicle {
public:
    TwoWheeler(string r, double rate) : Vehicle(r, rate) {}
    double charge(int days) const override { return dailyRate * days; }
    string type() const override { return "TwoWheeler"; }
};

class Car : public Vehicle {
    int seats;
public:
    Car(string r, double rate, int s) : Vehicle(r, rate), seats(s) {}
    double charge(int days) const override { return dailyRate * days; }
    string type() const override { return "Car"; }
};

class ElectricCar : public Vehicle {
    double batteryKwh;
public:
    ElectricCar(string r, double rate, double kwh)
        : Vehicle(r, rate), batteryKwh(kwh) {}
    double charge(int days) const override { return dailyRate * days + batteryKwh * 2; }
    string type() const override { return "ElectricCar"; }
};

// New type added without changing existing vehicle classes
class ElectricBus : public Vehicle {
public:
    ElectricBus(string r, double rate) : Vehicle(r, rate) {}
    double charge(int days) const override { return dailyRate * days + 500; }
    string type() const override { return "ElectricBus"; }
};

int main() {
    vector<unique_ptr<Vehicle>> fleet;
    fleet.push_back(make_unique<Bicycle>("BIKE01", 100));
    fleet.push_back(make_unique<TwoWheeler>("TW01", 250));
    fleet.push_back(make_unique<Car>("CAR01", 1000, 5));
    fleet.push_back(make_unique<ElectricCar>("EV01", 1200, 50));
    fleet.push_back(make_unique<ElectricBus>("BUS01", 3000));

    for (auto& v : fleet) {
        v->rent();
        v->print(2);
        v->giveBack();
    }
    return 0;
}
