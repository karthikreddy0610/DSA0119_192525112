# DSA01 – Assignment 4 (CO4) and Assignment 5 (CO5)

Simple C++17 programs arranged task-wise.

## Folder structure
- `Assignment4/Task01` to `Task06`: CO4 programs
- `Assignment5/TaskB1` to `TaskB4`: CO5 implementation programs

## Requirements
Install a C++ compiler such as g++.

Compile one program at a time:
```bash
g++ -std=c++17 -Wall -Wextra Task01.cpp -o app
./app
```
For memory checking (where supported):
```bash
g++ -std=c++17 -Wall -Wextra -fsanitize=address -g Task04.cpp -o app
./app
```
For timing:
```bash
g++ -std=c++17 -O2 -Wall -Wextra TaskB3.cpp -o benchmark
./benchmark
```

## GitHub submission
1. Create a repository named `DSA01-<RegisterNumber>-Assignment4` for CO4.
2. Create another repository named `DSA01-<RegisterNumber>-Assignment5` for CO5.
3. Upload the matching assignment folder to each repository (or copy its contents).
4. Commit task folders separately, for example:
   `git add Assignment4/Task01 && git commit -m "Complete CO4 Task 1"`
5. Repeat for every task and push:
```bash
git push
```

## Before submitting
- Replace your name and register number in your report/README.
- Compile and run every program on your own computer.
- Save your own terminal output screenshots in the matching task folder.
- Assignment 4 and 5 also require written explanations, diagrams, pseudocode, predictions and complexity analysis. These are not replaced by source code.
- Check the output and explain the program in your own words during your viva.
