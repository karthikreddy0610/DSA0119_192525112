#include <iostream>
#include <string>
using namespace std;

class Time {
public:
    int h, m, s;

    Time(int hour = 0, int minute = 0, int second = 0) {
        h = hour;
        m = minute;
        s = second;
    }

    // Prefix ++
    Time& operator++() {
        s++;
        if (s == 60) {
            s = 0;
            m++;
        }
        if (m == 60) {
            m = 0;
            h++;
        }
        return *this;
    }

    // Postfix ++
    Time operator++(int) {
        Time old = *this;
        ++(*this);
        return old;
    }

    bool operator==(Time t) {
        return h == t.h && m == t.m && s == t.s;
    }

    bool operator<(Time t) {
        if (h != t.h) return h < t.h;
        if (m != t.m) return m < t.m;
        return s < t.s;
    }

    void display() {
        cout << h << ":" << m << ":" << s << endl;
    }
};

class Playlist {
private:
    string songs[3];

public:
    Playlist() {
        songs[0] = "Song One";
        songs[1] = "Song Two";
        songs[2] = "Song Three";
    }

    string& operator[](int index) {
        if (index < 0 || index >= 3) {
            cout << "Invalid song number" << endl;
            return songs[0];
        }
        return songs[index];
    }

    const string& operator[](int index) const {
        if (index < 0 || index >= 3)
            return songs[0];
        return songs[index];
    }
};

int main() {
    Time t(0, 59, 58);

    t.display();
    t++;
    t.display();
    ++t;
    t.display();

    Playlist p;
    cout << p[0] << endl;
    cout << p[1] << endl;
    p[1] = "My Favourite Song";
    cout << p[1] << endl;

    return 0;
}
