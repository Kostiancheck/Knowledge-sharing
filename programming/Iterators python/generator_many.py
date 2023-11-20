import os

dir_path = "/home/cian/python/generators"

def get_files():
    for file in os.listdir(dir_path):
        yield file

def check_is_file():
    for file in get_files():
        if os.path.isfile(os.path.join(dir_path, file)):
            yield file

def pprint_file():
    for file in check_is_file():
        yield f"BEAUTIFUL NAME {file}"

for file in pprint_file():
    print(file)