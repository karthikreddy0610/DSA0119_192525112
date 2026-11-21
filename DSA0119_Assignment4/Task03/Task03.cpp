// CO4 Task 3: Base/member construction and destruction order
#include <iostream>
#include <string>
using namespace std;

class Person {
protected:
    string name;
    int age;
public:
    Person(string n, int a) : name(n), age(a) { cout << "Person constructed\n"; }
    ~Person() { cout << "Person destroyed\n"; }
};

class Address {
    string city;
    int pin;
public:
    Address(string c, int p) : city(c), pin(p) { cout << "Address constructed\n"; }
    ~Address() { cout << "Address destroyed\n"; }
    string str() const { return city + "-" + to_string(pin); }
};

class Student : public Person {
    long long regNo;
    Address home;
public:
    Student(string n, int a, long long r, string city, int pin)
        : Person(n, a), regNo(r), home(city, pin) {
        cout << "Student constructed\n";
    }
    ~Student() { cout << "Student destroyed\n"; }
    void print() const {
        cout << regNo << " " << name << " (" << age << ") " << home.str() << '\n';
    }
};

int main() {
    {
        Student s("Kavya", 19, 192311001, "Salem", 636001);
        s.print();
    }
    return 0;
}
