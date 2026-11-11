#include <iostream>
using namespace std;
struct Parcel{double weight;};
double charge(double kg,bool express=false,bool insured=false){
 double amount=kg*10;
 if(express) amount+=50;
 if(insured) amount+=20;
 return amount;
}
double charge(int grams){return grams*0.01;}
double charge(Parcel p){return p.weight*10;}
int main(){
 Parcel p={3.0};
 cout<<charge(2)<<endl;
 cout<<charge(2.0)<<endl;
 cout<<charge(2.0f)<<endl;
 cout<<charge(2.0,true)<<endl;
 cout<<charge(2.0,true,true)<<endl;
 cout<<charge(p)<<endl;
}
