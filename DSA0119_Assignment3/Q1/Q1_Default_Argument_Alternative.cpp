#include <iostream>
#include <string>
using namespace std;

class Book {
private:
    string title;
    int copies;

public:
    Book(string t = "Unknown", int c = 0) {
        title = t;
        copies = (c >= 0) ? c : 0;
    }

    void display() {
        cout << title << " - " << copies << " copies" << endl;
    }
};

int main() {
    Book a;
    Book b("C++");
    Book c("Java", 4);

    a.display();
    b.display();
    c.display();
    return 0;
}
