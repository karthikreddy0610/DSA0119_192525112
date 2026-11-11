#include <iostream>
#include <iomanip>
using namespace std;

class Money {
private:
    long long paise;

public:
    Money(long long rupees = 0, int p = 0) {
        paise = rupees * 100 + p;
    }

    Money operator+(Money m) {
        Money result;
        result.paise = paise + m.paise;
        return result;
    }

    Money operator-(Money m) {
        Money result;
        result.paise = paise - m.paise;
        return result;
    }

    Money& operator+=(Money m) {
        paise += m.paise;
        return *this;
    }

    bool operator==(Money m) {
        return paise == m.paise;
    }

    bool operator<(Money m) {
        return paise < m.paise;
    }

    friend ostream& operator<<(ostream &out, Money m) {
        out << "Rs " << m.paise / 100 << "."
            << setw(2) << setfill('0') << m.paise % 100
            << setfill(' ');
        return out;
    }

    friend istream& operator>>(istream &in, Money &m) {
        long long rupees;
        int p;
        in >> rupees >> p;
        m.paise = rupees * 100 + p;
        return in;
    }
};

int main() {
    Money a(120, 75), b(79, 25);
    Money c = a + b;

    cout << c << endl;
    cout << boolalpha << (c == Money(200)) << endl;

    Money d(0, 75), e(0, 50);
    cout << "Paise carry test: " << d + e << endl;

    return 0;
}
