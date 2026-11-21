// CO4 Task 5: Object, pointer, reference, new/delete and this pointer
#include <iomanip>
#include <iostream>
#include <string>
using namespace std;

class Cart {
    string items[10];
    double prices[10];
    int count = 0;
    double discount = 0;
public:
    Cart& add(string item, double price) {
        if (count < 10) {
            items[count] = item;
            prices[count] = price;
            ++count;
        }
        return *this;
    }

    Cart& setDiscount(double discount) {
        this->discount = discount;
        return *this;
    }

    double total() const {
        double sum = 0;
        for (int i = 0; i < count; ++i) sum += prices[i];
        return sum * (100 - discount) / 100;
    }
};

int main() {
    Cart c;                         // direct object
    c.add("Rice", 60).add("Dal", 120).setDiscount(10);

    Cart* pointer = &c;             // pointer to existing object
    pointer->add("Oil", 180);
    cout << fixed << setprecision(2) << pointer->total() << '\n';

    Cart& reference = c;            // reference
    cout << reference.total() << '\n';

    Cart* dynamicCart = new Cart(); // dynamically created object
    dynamicCart->add("Milk", 50);
    cout << dynamicCart->total() << '\n';
    delete dynamicCart;
    return 0;
}
