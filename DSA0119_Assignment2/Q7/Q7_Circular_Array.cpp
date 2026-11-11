#include <iostream>
using namespace std;
class History{
 int data[10],count,start;
public:
 History(){count=0;start=0;}
 void add(int x){
  if(count<10){data[(start+count)%10]=x;count++;}
  else{data[start]=x;start=(start+1)%10;}
 }
 void show(){
  for(int i=0;i<count;i++)cout<<data[(start+i)%10]<<" ";
  cout<<endl;
 }
};
int main(){History h;for(int i=1;i<=12;i++)h.add(i*100);h.show();}
