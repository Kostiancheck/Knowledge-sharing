from itertools import batched

def main():
    a = [1,2,3,4,5,6,7,8,9]
    for i in batched(a, 2):
        print(i)


if __name__ == "__main__":
    main()
