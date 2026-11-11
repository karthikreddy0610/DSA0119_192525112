#include <iostream>
using namespace std;
int& highestMark(int marks[],int n){
 int index=0;
 for(int i=1;i<n;i++) if(marks[i]>marks[index]) index=i;
 return marks[index];
}
int main(){
 int marks[5]={75,88,92,81,79};
 cout<<"Highest: "<<highestMark(marks,5)<<endl;
 highestMark(marks,5)=95;
 cout<<"After moderation: "<<marks[2]<<endl;
 // Never return a reference to a local variable: it becomes dangling.
}
