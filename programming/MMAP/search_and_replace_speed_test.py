import mmap
import os
import shutil

def regular_io_find_and_replace(filename):
    with open(filename, "r", encoding="utf-8") as orig_file_obj:
        with open("tmp.txt", "w", encoding="utf-8") as new_file_obj:
            orig_text = orig_file_obj.read()
            new_text = orig_text.replace(" the ", " eht ")
            new_file_obj.write(new_text)

    shutil.copyfile("tmp.txt", filename)
    os.remove("tmp.txt")

def mmap_io_find_and_replace(filename):
    with open(filename, mode="r+", encoding="utf-8") as file_obj:
        with mmap.mmap(file_obj.fileno(), length=0, access=mmap.ACCESS_WRITE) as mmap_obj:
            orig_text = mmap_obj.read()
            new_text = orig_text.replace(b" the ", b" eht ")
            mmap_obj[:] = new_text
            mmap_obj.flush()

if __name__ == "__main__":
    import timeit

    t1 = timeit.repeat(
        "regular_io_find_and_replace('test.txt')",
        repeat=3,
        number=1,
        setup="from __main__ import regular_io_find_and_replace",
    )
    t2 = timeit.repeat(
        "mmap_io_find_and_replace('test.txt')",
        repeat=3,
        number=1,
        setup="from __main__ import mmap_io_find_and_replace",
    )

    print(f"REGULAR {t1}; MMAP {t2}")