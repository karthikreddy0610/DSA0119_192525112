// CO4 Task 2: Virtual base class removes the diamond duplication
#include <iostream>
#include <string>
using namespace std;

class Person {
protected:
    string name;
public:
    Person(string n = "Unknown") : name(n) { cout << "Person "; }
};

class Student : virtual public Person {
public:
    Student(string n = "Unknown") : Person(n) { cout << "Student "; }
};

class Staff : virtual public Person {
public:
    Staff(string n = "Unknown") : Person(n) { cout << "Staff "; }
};

class TeachingAssistant : public Student, public Staff {
public:
    TeachingAssistant(string n) : Person(n), Student(n), Staff(n) {
        cout << "TA ";
    }
    void show() const { cout << "\nName: " << name << '\n'; }
};

class ResearchScholar : public Student {
    double fellowship;
public:
    ResearchScholar(string n, double f) : Person(n), Student(n), fellowship(f) {}
    void show() const { cout << name << " fellowship = " << fellowship << '\n'; }
};

int main() {
    TeachingAssistant ta("Kavya");
    ta.show();
    ResearchScholar rs("Arun", 12000);
    rs.show();
    return 0;
}
