#include <iostream>
using namespace std;
class History{
 int data[10],count;
public:
 History(){count=0;}
 void add(int x){
  if(count<10)data[count++]=x;
  else{for(int i=0;i<9;i++)data[i]=data[i+1];data[9]=x;}
 }
 void show(){for(int i=0;i<count;i++)cout<<data[i]<<" ";cout<<endl;}
};
int main(){History h;for(int i=1;i<=12;i++)h.add(i*100);h.show();}
