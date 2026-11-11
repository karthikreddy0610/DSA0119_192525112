# DSA01 Assignment 3 – Simple C++ Codes

Beginner-friendly example programs for Assignment 3 (CO3), Q1–Q7.

## Folders
- Q1: Constructors and constructor overloading
- Q2: Copy constructor, copy assignment and destructor (deep copy)
- Q3: Dynamic 2D seat map and object lifetime output
- Q4: Money class and overloaded operators
- Q5: Prefix/postfix increment, comparisons and playlist subscript
- Q6: Text class with dynamic memory and overloaded operators
- Q7: Complex-number class and impedance calculations

## Compile one program
```bash
g++ -std=c++17 -Wall -Wextra Q4/Q4_Money_Operators.cpp -o q4
```
Windows PowerShell:
```powershell
.\q4.exe
```
Linux/macOS:
```bash
./q4
```
Compile each `.cpp` file separately because each has its own `main()`.

## Before submission
1. Run every program yourself and save output screenshots in its question folder.
2. Write predicted outputs before running the prediction programs.
3. Q2, Q3 and Q6 require memory-safety checks using AddressSanitizer where available.
4. Q6 asks for comparison with `std::string`; Q7 asks for comparison with `std::complex<double>`.
5. Add your name, register number, compiler version and repository link.
6. The report also needs explanations, memory diagrams, design decisions, Big-O analysis, test evidence and timings. Code alone is not the complete assignment.
