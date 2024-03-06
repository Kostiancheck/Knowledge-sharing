import multiprocessing as mp


def read_file(file_name: str, from_block: int, block_size: int) -> int:
    cities = {}
    with open(file_name, "rb") as f:
        f.seek(from_block)
        if from_block != 0:
            line_fragment = f.readline()
            to_read = block_size - len(line_fragment)
        else:
            to_read = block_size
        lines = f.read(to_read).decode()
        for line in lines.split("\n"):
            data = line.split(",")
            city = data[0]
            try:
                temperature = data[1]
            except IndexError:
                print("indexerror", line)
                continue
            try:
                temperature = float(temperature)
            except ValueError:
                print("valueerror", line)
                continue
            if city not in cities:
                cities[city] = {"min": 50, "max": -50, "sum": 0, "count": 0}
            if temperature < cities[city]["min"]:
                cities[city]["min"] = temperature
            if temperature > cities[city]["max"]:
                cities[city]["max"] = temperature
            cities[city]["sum"] += temperature
            cities[city]["count"] += 1
    return cities


if __name__ == "__main__":
    file_name = "temperatures.csv"

    BLOCK_SIZE = 2_000_000 * 20

    block_count = 0

    # count number of blocks by moving pointer
    with open(file_name, "rb") as f:
        while True:
            f.seek(block_count * BLOCK_SIZE)
            line_fragment = f.readline()  # Read to the end of the current line

            block_count += 1

            if not line_fragment or line_fragment == b"":  # Check for EOF
                break

    print(f"Block count: {block_count}")

    with mp.Pool() as pool:
        results = pool.starmap(
            read_file, [(file_name, BLOCK_SIZE * i, BLOCK_SIZE) for i in range(block_count)]
        )
        
    # merge results
    cities = {}
    for res in results:
        for city in res:
            if city not in cities:
                cities[city] = {"min": 50, "max": -50, "sum": 0, "count": 0}
            if res[city]["min"] < cities[city]["min"]:
                cities[city]["min"] = res[city]["min"]
            if res[city]["max"] > cities[city]["max"]:
                cities[city]["max"] = res[city]["max"]
            cities[city]["sum"] += res[city]["sum"]
            cities[city]["count"] += res[city]["count"]
    
    with open("test4.csv", "w") as f:
        f.write("city,min,mean,max\n")
        for city in cities:
            row = f'{city},{cities[city]["min"]},{cities[city]["sum"]/cities[city]["count"]},{cities[city]["max"]}'
            f.write(row + "\n")
    