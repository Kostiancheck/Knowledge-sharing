import random

if __name__ == "__main__":
    integers = [random.randint(1,100_000_000) for _ in range(1_000_000)]
    squares = [integer ** 0.6 for integer in integers]
    mean = sum(squares) / len(squares)
    print(f"Mean is {mean}")
