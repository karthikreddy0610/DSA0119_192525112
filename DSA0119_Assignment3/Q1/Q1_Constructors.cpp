#include <iostream>
#include <string>
using namespace std;

class Book {
private:
    string title;
    int copies;

public:
    Book() : Book("Unknown", 0) {
    }

    Book(string t) : Book(t, 0) {
    }

    Book(string t, int c) : title(t), copies(c >= 0 ? c : 0) {
    }

    void display() {
        cout << "Title: " << title << ", Copies: " << copies << endl;
    }
};

int main() {
    Book b1;
    Book b2("C++ Basics");
    Book b3("Data Structures", 5);

    b1.display();
    b2.display();
    b3.display();

    return 0;
}
