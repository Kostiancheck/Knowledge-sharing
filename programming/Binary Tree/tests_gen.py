import random

SIZE = 200_000

integers = [str(random.randint(100, 999_999)) for _ in range(SIZE)]

with open("integers.txt", "w") as f:
    f.write(",".join(integers))

with open("tests.txt", "w") as f:
    f.write(integers[0] + ",")
    f.write(integers[int(len(integers) * 0.25)] + ",")
    f.write(integers[int(len(integers) * 0.5)] + ",")
    f.write(integers[int(len(integers) * 0.75)] + ",")
    f.write(integers[-1] + ",")
    f.write('1,')

    for i in range(9):
        f.write(random.choice(integers) + ",")
    f.write(random.choice(integers))