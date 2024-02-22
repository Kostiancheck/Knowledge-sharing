#include <math.h>
#include <stdio.h>
#include <string.h>
#include <errno.h>
#include <stdlib.h>
#include <ctype.h>

const unsigned SIZE = 227989;

char *getfield(char *line, int num)
{
    char *line_copy = strdup(line); // Make a copy of the input string
    char *tok;
    for (tok = strtok(line_copy, ",");
         tok && *tok;
         tok = strtok(NULL, ",\n"))
    {
        if (!--num)
            return tok;
    }
    return NULL;
}

unsigned string_to_base28_number(char *string)
{
    // Define a dictionary mapping characters to their numeric values
    int char_values[28];                              // 26 letters + hyphen + space
    char alphabet[] = "abcdefghijklmnopqrstuvwxyz- "; // Include hyphen and space
    for (int i = 0; i < 28; i++)
    {
        char_values[i] = i + 1;
    }

    // Convert the string into a base-28 number
    unsigned base28_number = 0;
    for (int i = 0; i < strlen(string); i++)
    {
        char c = tolower(string[strlen(string) - i - 1]); // Iterate from last to first, convert character to lowercase
        char *found_ptr = strchr(alphabet, c);
        if (found_ptr == NULL)
        {
            printf("Couldn't find char %c in alphabet\n", found_ptr);
        }
        else
        {
            // printf("char %c\n", c);
            int index = found_ptr - alphabet;
            // printf("index %i\n", index);
            int value = char_values[index];
            float decimal_place_pow = pow(28, (float)i);
            unsigned decimal_place_pow_u = (unsigned)decimal_place_pow;
            // printf("value %i, %llu\n", value, decimal_place_pow_u);
            base28_number += value * (unsigned)decimal_place_pow_u;
        }
    }

    return base28_number;
}

unsigned djb2(char *str)
{
    // http://www.cse.yorku.ca/~oz/hash.html
    unsigned hash = 5381;
    int c;

    while (c = *str++)
        hash = ((hash << 5) + hash) + c; /* hash * 33 + c */

    return hash;
}

unsigned sdbm(char *str)
{
    unsigned hash = 0;
    int c;

    while (c = *str++)
        hash = c + (hash << 6) + (hash << 16) - hash;

    return hash;
}

unsigned hash(char *string)
{
    unsigned to_number = string_to_base28_number(string);
    // printf("Convered to number %llu\n", to_number);
    unsigned mod = to_number % SIZE;
    // printf("Mod size: %u\n", mod);
    return mod;
}

int main(int argc, char *argv[])
{
    char **HashMap = calloc(SIZE, sizeof(char *));

    // read csv code from https://stackoverflow.com/questions/12911299/read-csv-file-in-c
    FILE *stream = fopen("dict.csv", "r");

    char line[1024];
    int row = 0;
    while (fgets(line, 1024, stream))
    {
        row++;
        if (row == 1)
            continue;
        // if (row ==15)
        //     break;
        char *word = getfield(line, 1);
        // printf("Word is %s\n", word);
        char *definition = getfield(line, 3);
        // printf("Definition is %s\n", definition);

        unsigned hashed = hash(word);
        // printf("hashed %u\n", hashed);
        HashMap[hashed] = definition;
        // printf("HashMap %s\n", HashMap[hashed]);
    }

    unsigned count_hashed = 0;
    for (int i = 0; i < SIZE; i++)
    {
        if (HashMap[i] != NULL)
        {
            // printf("Definition on index %i - %s\n", i, HashMap[i]);
            count_hashed++;
        }
    }

    printf("Total hashmap unique values: %i\n", count_hashed);

    char *test = "Hash";
    int hashed_test = hash(test);
    printf("Test word: %s\n", test);
    printf("Test word hashed: %i\n", hashed_test);
    printf("Test word definition fetched from HashMap: %s\n", HashMap[hashed_test]);

    test = "Tek";
    hashed_test = hash(test);
    printf("Test word: %s\n", test);
    printf("Test word hashed: %i\n", hashed_test);
    printf("Test word definition fetched from HashMap: %s\n", HashMap[hashed_test]);

    return 0;
}