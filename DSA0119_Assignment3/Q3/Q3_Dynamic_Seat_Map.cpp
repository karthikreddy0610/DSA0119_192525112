#include <iostream>
using namespace std;

class Auditorium {
private:
    int rows, seats;
    char **map;
    int booked;

public:
    Auditorium(int r, int s) {
        rows = r;
        seats = s;
        booked = 0;

        if (rows <= 0 || seats <= 0) {
            rows = 0;
            seats = 0;
            map = nullptr;
        } else {
            map = new char*[rows];

            for (int i = 0; i < rows; i++) {
                map[i] = new char[seats];

                for (int j = 0; j < seats; j++)
                    map[i][j] = 'O';
            }
        }

        cout << "Auditorium created" << endl;
    }

    void book(int r, int s) {
        if (r < 0 || r >= rows || s < 0 || s >= seats) {
            cout << "Invalid seat" << endl;
        } else if (map[r][s] == 'X') {
            cout << "Seat already booked" << endl;
        } else {
            map[r][s] = 'X';
            booked++;
            cout << "Seat booked" << endl;
        }
    }

    void cancel(int r, int s) {
        if (r >= 0 && r < rows && s >= 0 && s < seats && map[r][s] == 'X') {
            map[r][s] = 'O';
            booked--;
            cout << "Booking cancelled" << endl;
        } else {
            cout << "Cannot cancel this seat" << endl;
        }
    }

    void display() {
        for (int i = 0; i < rows; i++) {
            for (int j = 0; j < seats; j++)
                cout << map[i][j] << " ";
            cout << endl;
        }
    }

    ~Auditorium() {
        for (int i = 0; i < rows; i++)
            delete[] map[i];

        delete[] map;
        cout << "Auditorium closed. Booked seats: " << booked << endl;
    }
};

int main() {
    Auditorium hall(2, 3);
    hall.book(0, 1);
    hall.book(1, 2);
    hall.display();
    hall.cancel(0, 1);
    hall.display();

    Auditorium *event = new Auditorium(1, 2);
    event->book(0, 0);
    delete event;

    return 0;
}
