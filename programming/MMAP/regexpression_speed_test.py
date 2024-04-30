import re
import mmap


def mmap_io_re(filename):
    five_letter_word = re.compile(rb"\b[a-zA-Z]{5}\b")

    with open(filename, mode="r", encoding="utf-8") as file_obj:
        with mmap.mmap(
            file_obj.fileno(), length=0, access=mmap.ACCESS_READ
        ) as mmap_obj:
            for word in five_letter_word.findall(mmap_obj):
                print(word)


def regular_io_re(filename):
    five_letter_word = re.compile(r"\b[a-zA-Z]{5}\b")

    with open(filename, mode="r", encoding="utf-8") as file_obj:
        for word in five_letter_word.findall(file_obj.read()):
            print(word)


if __name__ == "__main__":
    import timeit

    t1 = timeit.repeat(
        "regular_io_re('test.txt')",
        repeat=3,
        number=1,
        setup="from __main__ import regular_io_re",
    )
    t2 = timeit.repeat(
        "mmap_io_re('test.txt')",
        repeat=3,
        number=1,
        setup="from __main__ import mmap_io_re",
    )

    print(f"REGULAR {t1}; MMAP {t2}")
