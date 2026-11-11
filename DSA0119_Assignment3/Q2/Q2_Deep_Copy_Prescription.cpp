#include <iostream>
#include <string>
using namespace std;

class Prescription {
private:
    int n;
    string *medicines;

public:
    Prescription(int count) {
        n = count;
        medicines = new string[n];
    }

    // Copy constructor: makes a separate array.
    Prescription(const Prescription &other) {
        n = other.n;
        medicines = new string[n];

        for (int i = 0; i < n; i++)
            medicines[i] = other.medicines[i];
    }

    // Copy assignment operator.
    Prescription& operator=(const Prescription &other) {
        if (this != &other) {
            delete[] medicines;

            n = other.n;
            medicines = new string[n];

            for (int i = 0; i < n; i++)
                medicines[i] = other.medicines[i];
        }
        return *this;
    }

    ~Prescription() {
        delete[] medicines;
    }

    void set(int i, string medicine) {
        if (i >= 0 && i < n)
            medicines[i] = medicine;
    }

    string get(int i) const {
        if (i >= 0 && i < n)
            return medicines[i];
        return "";
    }
};

int main() {
    Prescription p(2);
    p.set(0, "Paracetamol");
    p.set(1, "ORS");

    Prescription q = p;
    q.set(1, "Cetirizine");

    Prescription r(1);
    r = p;

    p.set(0, "Ibuprofen");

    cout << p.get(0) << " " << p.get(1) << " | ";
    cout << q.get(0) << " " << q.get(1) << " | ";
    cout << r.get(0) << " " << r.get(1) << endl;

    return 0;
}
