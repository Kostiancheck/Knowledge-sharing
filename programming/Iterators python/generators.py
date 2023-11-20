def generator(limit):
    for i in range(limit):
        yield "foo"


if __name__ == "__main__":
    for v in generator(5):
        print(v)

    print("".join(["=" for i in range(50)]))

    for v in ("foo" for i in range(5)): # expression
        print(v)