#include <iostream>
#include <cmath>
using namespace std;

class Complex {
private:
    double real, imag;

public:
    Complex() {
        real = 0;
        imag = 0;
    }

    Complex(double r) {
        real = r;
        imag = 0;
    }

    Complex(double r, double i) {
        real = r;
        imag = i;
    }

    Complex operator+(Complex c) {
        return Complex(real + c.real, imag + c.imag);
    }

    Complex operator-(Complex c) {
        return Complex(real - c.real, imag - c.imag);
    }

    Complex operator*(Complex c) {
        double r = real * c.real - imag * c.imag;
        double i = real * c.imag + imag * c.real;
        return Complex(r, i);
    }

    Complex operator/(Complex c) {
        double d = c.real * c.real + c.imag * c.imag;

        if (d == 0) {
            cout << "Error: Division by zero impedance" << endl;
            return Complex(0, 0);
        }

        double r = (real * c.real + imag * c.imag) / d;
        double i = (imag * c.real - real * c.imag) / d;
        return Complex(r, i);
    }

    bool operator==(Complex c) {
        return real == c.real && imag == c.imag;
    }

    double magnitude() {
        return sqrt(real * real + imag * imag);
    }

    friend ostream& operator<<(ostream &out, Complex c) {
        out << c.real;
        if (c.imag >= 0)
            out << " + j" << c.imag;
        else
            out << " - j" << -c.imag;
        return out;
    }
};

int main() {
    Complex resistor(10, 0);
    Complex inductor(0, 5);
    Complex capacitor(0, -2);

    Complex series = resistor + inductor + capacitor;
    cout << "Series impedance: " << series << endl;
    cout << "Magnitude: " << series.magnitude() << endl;

    Complex z1(10, 5), z2(10, -5);
    Complex parallel = (z1 * z2) / (z1 + z2);
    cout << "Parallel impedance: " << parallel << endl;

    Complex zero(0, 0);
    Complex test = z1 / zero;
    cout << "Division result: " << test << endl;

    return 0;
}
