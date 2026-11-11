#include <iostream>
using namespace std;
void value(int fee){ fee -= fee*10/100; cout << "Inside value: " << fee << endl; }
void reference(int &fee){ fee -= fee*10/100; }
void pointer(int *fee){ *fee -= *fee*10/100; }
int main(){
 int a=45000,b=45000,c=45000;
 value(a); cout<<"After value: "<<a<<endl;
 reference(b); cout<<"After reference: "<<b<<endl;
 pointer(&c); cout<<"After pointer: "<<c<<endl;
}
