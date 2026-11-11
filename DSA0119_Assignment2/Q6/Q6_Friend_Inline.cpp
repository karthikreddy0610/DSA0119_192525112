#include <iostream>
#include <cstdlib>
using namespace std;
class Time{
 int h,m;
public:
 Time(int hh,int mm){h=hh;m=mm;}
 friend int minutesBetween(const Time&,const Time&);
 friend bool earlier(const Time&,const Time&);
};
inline int minutesBetween(const Time&a,const Time&b){
 int x=a.h*60+a.m,y=b.h*60+b.m;
 return abs(x-y);
}
inline bool earlier(const Time&a,const Time&b){
 if(a.h<b.h)return true;
 if(a.h==b.h && a.m<b.m)return true;
 return false;
}
int main(){
 Time departure(9,45),arrival(13,10);
 cout<<minutesBetween(departure,arrival)<<" "<<boolalpha<<earlier(arrival,departure)<<endl;
 Time x(11,30),y(11,30);
 cout<<minutesBetween(x,y)<<" "<<earlier(x,y)<<endl;
}
