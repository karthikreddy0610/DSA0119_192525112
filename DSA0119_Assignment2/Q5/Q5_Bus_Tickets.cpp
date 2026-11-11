#include <iostream>
#include <string>
using namespace std;
class BusTicket{
 static int issued;
 static const int CAPACITY=3;
 int seat;
 string name;
public:
 BusTicket(string n){name=n;seat=0;if(issued<CAPACITY)seat=++issued;}
 static int count(){return issued;}
 void print()const{
  cout<<name<<": ";
  if(seat) cout<<"Seat "<<seat<<endl;
  else cout<<"Waiting"<<endl;
 }
};
int BusTicket::issued=0;
int main(){
 BusTicket trip[4]={BusTicket("Asha"),BusTicket("Bala"),BusTicket("Chitra"),BusTicket("Dev")};
 for(int i=0;i<4;i++) trip[i].print();
 cout<<"Issued: "<<BusTicket::count()<<endl;
}
