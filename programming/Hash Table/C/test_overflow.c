#include <limits.h>
#include <stdio.h>

int main(int argc, char *argv[])
{
    int a = INT_MAX;
    printf("Signed int max: %d\n", a);
    a++;
    printf("Signed int max + 1: %d\n--\n", a);

    unsigned int b = UINT_MAX;
    printf("Unsigned int max (%%i): %i\n", b);
    b++;
    printf("Unsigned int max + 1 (%%i): %i\n--\n", b);

    unsigned int c = UINT_MAX;
    printf("Unsigned int max (%%u): %u\n", c);
    c++;
    printf("Unsigned int max + 1 (%%u): %u\n--\n", c);

    unsigned long long int d = ULLONG_MAX;
    printf("Unsigned long long int max (%%llu): %llu\n", d);
    d++;
    printf("Unsigned long long int max + 1 (%%llu): %llu\n", d);
}