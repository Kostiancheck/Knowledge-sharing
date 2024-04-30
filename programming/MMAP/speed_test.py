import mmap


def regular_io_find(filename):
    with open(filename, mode="r", encoding="utf-8") as file_obj:
        text = file_obj.read()
        print(text.find(" the "))


def mmap_io_find(filename):
    with open(filename, mode="r", encoding="utf-8") as file_obj:
        with mmap.mmap(
            file_obj.fileno(), length=0, access=mmap.ACCESS_READ
        ) as mmap_obj:
            print(mmap_obj.find(b" the "))


if __name__ == "__main__":
    import timeit

    t1 = timeit.repeat(
        "regular_io_find('test.txt')",
        repeat=3,
        number=1,
        setup="from __main__ import regular_io_find",
    )
    t2 = timeit.repeat(
        "mmap_io_find('test.txt')",
        repeat=3,
        number=1,
        setup="from __main__ import mmap_io_find",
    )

    print(f"REGULAR {t1}; MMAP {t2}")
