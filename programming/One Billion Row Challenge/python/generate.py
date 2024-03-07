import faker
import random
import json

TOTAL_ROWS = 1_000_000_000
STATIONS_NUM = 2_000

if __name__ == "__main__":
    fake = faker.Faker()

    stations = set()
    while len(stations) != STATIONS_NUM:
        city = fake.city()
        if "." in city or "," in city:
            raise Exception(". or , in city")
        stations.add(city)
    stations = list(stations)
    station_counts = {station: 0 for station in stations}

    count = 0
    with open("temperatures.csv", "w") as f:
        j = 0
        while count < TOTAL_ROWS:
            city = stations[j]
            range_max = int(len(city) * 2 * (random.random()) * 100)
            range_min = int(len(city) * -1 * (random.random()) * 100)
            row = f"{city},{float(random.randint(range_min,range_max)) / 100}"
            f.write(row + "\n")
            station_counts[stations[j]] += 1
            j += 1
            if j >= len(stations):
                j = 0
            count += 1

    with open("stations_counts.json", "w") as f:
        json.dump(station_counts, f)
