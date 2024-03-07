if __name__ == "__main__":
    cities = {}
    with open("temperatures.csv", "r") as f:
        for line in f:
            data = line.split(",")
            city = data[0]
            temperature = float(data[1])
            if city not in cities:
                cities[city] = {"min": 50, "max": -50, "sum": 0, "count": 0}
            if temperature < cities[city]["min"]:
                cities[city]["min"] = temperature
            if temperature > cities[city]["max"]:
                cities[city]["max"] = temperature
            cities[city]["sum"] += temperature
            cities[city]["count"] += 1

    with open("test.csv", "w") as f:
        f.write("city,min,mean,max\n")
        for city in cities:
            row = f'{city},{cities[city]["min"]},{cities[city]["sum"]/cities[city]["count"]},{cities[city]["max"]}'
            f.write(row + "\n")
