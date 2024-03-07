import csv
import os
from multiprocessing import Pool, cpu_count, Manager
from datetime import datetime


class TempStatPro3000:

    def __init__(self, file_path):
        self.file_path = file_path

    def update_temp(self, line, cities):
        city = line[0].decode('utf-8')
        temperature = float(line[1])

        # Get or create the city entry and update its values
        if city not in cities:
            cities[city] = {"min": temperature, "max": temperature, "sum": temperature, "count": 1}
        else:
            city_entry = cities[city]
            city_entry["min"] = min(city_entry["min"], temperature)
            city_entry["max"] = max(city_entry["max"], temperature)
            city_entry["sum"] += temperature
            city_entry["count"] += 1

    def process_chunk(self, chunk_start: int, chunk_size: int, cities):
        chunk_end = chunk_start + chunk_size
        with open(self.file_path, "rb") as file:
            file.seek(chunk_start)

            # iterate until the end of the line
            while file.read(1) != b"\n":
                file.seek(1, 1)

            for line in file:
                # stop when you iteration on lines of not your chunk (chunk of another process)
                if file.tell() > chunk_end:
                    break
                line = line.strip().split(b',')
                self.update_temp(line, cities)

    def run(self):
        print("Start:", datetime.now())
        file_size = os.path.getsize(self.file_path)
        chunk_size = 10_000
        chunks = range(0, file_size, chunk_size)

        manager = Manager()
        cities = manager.dict()

        with Pool(cpu_count()) as pool:
            pool.starmap(self.process_chunk, [(chunk, chunk_size, cities) for chunk in chunks])

        print("Finish dict creation:", datetime.now())

        with open("../1brc/test_test.csv", "w") as out_file:
            writer = csv.writer(out_file)
            writer.writerow(["city", "min", "sum", "count", "max"])

            for city, city_entry in cities.items():
                row = [
                    city,
                    city_entry["min"],
                    city_entry["sum"],
                    city_entry["count"],
                    city_entry["max"]
                ]
                writer.writerow(row)

        print("Finish uploading:", datetime.now())


if __name__ == "__main__":
    temp_file_path = '../1brc/temperatures.csv'
    temp_calculator = TempStatPro3000(temp_file_path)

    temp_calculator.run()
