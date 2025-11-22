#include <stdio.h>

int main() {
    char name[] = "Alice";
    int age = 30;
    float pi = 3.14159;

    printf("Hello, my name is %s.\n", name);
    printf("I am %d years old.\n", age);
    printf("The value of pi is approximately %.2f.\n", pi); // .2f for 2 decimal places

    return 0;
}