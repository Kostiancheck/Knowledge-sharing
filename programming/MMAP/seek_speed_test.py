import mmap

def mmap_io_find_and_seek(filename):
    with open(filename, mode="r", encoding="utf-8") as file_obj:
        with mmap.mmap(file_obj.fileno(), length=0, access=mmap.ACCESS_READ) as mmap_obj:
            mmap_obj.seek(10000)
            mmap_obj.find(b" the ")


def regular_io_find_and_seek(filename):
    with open(filename, mode="r", encoding="utf-8") as file_obj:
        file_obj.seek(10000)
        text = file_obj.read()
        text.find(" the ")



if __name__ == "__main__":
    import timeit

    t1 = timeit.repeat(
        "regular_io_find_and_seek('test.txt')",
        repeat=3,
        number=1,
        setup="from __main__ import regular_io_find_and_seek",
    )
    t2 = timeit.repeat(
        "mmap_io_find_and_seek('test.txt')",
        repeat=3,
        number=1,
        setup="from __main__ import mmap_io_find_and_seek",
    )

    print(f"REGULAR {t1}; MMAP {t2}")