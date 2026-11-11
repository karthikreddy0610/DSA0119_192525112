#include <iostream>
using namespace std;
class SavingsAccount{
 int accountNo,balance,transactions[10],count;
 void add(int amount);
public:
 SavingsAccount(int no,int money){accountNo=no;balance=money;count=0;}
 void deposit(int amount);
 void withdraw(int amount);
 void miniStatement();
};
void SavingsAccount::add(int amount){
 if(count<10) transactions[count++]=amount;
 else {for(int i=0;i<9;i++) transactions[i]=transactions[i+1];transactions[9]=amount;}
}
void SavingsAccount::deposit(int amount){
 if(amount>0){balance+=amount;add(amount);}
}
void SavingsAccount::withdraw(int amount){
 if(amount>0 && amount<=balance){balance-=amount;add(-amount);}
}
void SavingsAccount::miniStatement(){
 cout<<"Account: "<<accountNo<<" Balance: "<<balance<<endl;
 for(int i=0;i<count;i++) cout<<transactions[i]<<endl;
}
int main(){
 SavingsAccount a(101,5000);
 a.deposit(1000);a.withdraw(500);a.deposit(200);
 a.miniStatement();
}
