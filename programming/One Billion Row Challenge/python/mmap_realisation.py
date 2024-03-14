import os
import io
import time
import mmap
import concurrent.futures

INPUT_FILE_PATH = "../temperatures.csv"
OUTPUT_FILE_PATH = "../results.csv"
MEMORY_MAP_ALLOCATION_GRANULARITY = mmap.ALLOCATIONGRANULARITY


def calculate_chunk_boundaries():
    file_size = os.stat(INPUT_FILE_PATH).st_size
    size_per_processor = file_size // os.cpu_count()
    chunk_boundaries = []
    with io.open(INPUT_FILE_PATH, "rb") as file:
        start = 0
        end = start + size_per_processor
        while end < file_size:
            if (start + size_per_processor) < file_size:
                file.seek(size_per_processor, os.SEEK_CUR)
                current_byte = file.read(1)
                while current_byte != b"" and current_byte != b"\n":
                    current_byte = file.read(1)
                end = file.tell()
            else:
                end = file_size
            chunk_boundaries.append((start, end))
            start = end
    return chunk_boundaries


def process_temperature_data(start, end):
    weather_stats = {}
    offset = (
        start // MEMORY_MAP_ALLOCATION_GRANULARITY
    ) * MEMORY_MAP_ALLOCATION_GRANULARITY
    adjusted_start = abs(offset - start)
    mapping_length = adjusted_start + end - start
    with open(INPUT_FILE_PATH, "rb") as file_reader:
        memory_map = mmap.mmap(
            fileno=file_reader.fileno(),
            length=mapping_length,
            offset=offset,
            flags=mmap.MAP_PRIVATE,
        )
        memory_map.seek(adjusted_start)
        line = memory_map.readline()
        while line != b"":
            city, temperature = line.split(b",")
            temperature = float(temperature)
            if city not in weather_stats:
                weather_stats[city] = [temperature, temperature, temperature, 1]
            else:
                city_stats = weather_stats[city]
                if temperature < city_stats[0]:
                    city_stats[0] = temperature
                if temperature > city_stats[1]:
                    city_stats[1] = temperature
                city_stats[2] += temperature
                city_stats[3] += 1
            line = memory_map.readline()
        memory_map.close()
    return weather_stats


def write_results_to_csv(aggregated_results):
    with open(OUTPUT_FILE_PATH, "w") as file:
        file.write("city,min,mean,max\n")
        for city, stats in sorted(aggregated_results.items()):
            mean_temp = stats[2] / stats[3] if stats[3] != 0 else 0
            row = f'{city.decode("utf-8")},{stats[0]},{mean_temp},{stats[1]}'
            file.write(row + "\n")


def execute_processing():
    overall_weather_stats = {}
    start_time = time.perf_counter()
    chunk_boundaries = calculate_chunk_boundaries()
    with concurrent.futures.ProcessPoolExecutor(max_workers=os.cpu_count()) as executor:
        futures = [
            executor.submit(process_temperature_data, start, end)
            for start, end in chunk_boundaries
        ]
        for future in concurrent.futures.as_completed(futures):
            try:
                chunk_data = future.result()
            except Exception as exception:
                print(f"Exception occurred: {exception}")
            else:
                for city, stats in chunk_data.items():
                    if city not in overall_weather_stats:
                        overall_weather_stats[city] = stats
                    else:
                        combined_stats = overall_weather_stats[city]
                        combined_stats[0] = min(combined_stats[0], stats[0])
                        combined_stats[1] = max(combined_stats[1], stats[1])
                        combined_stats[2] += stats[2]
                        combined_stats[3] += stats[3]
    end_time = time.perf_counter()
    print(f"Time for processing: {end_time - start_time} seconds.")
    print("=" * 15, "Writing results to CSV", "=" * 15)
    write_results_to_csv(overall_weather_stats)


if __name__ == "__main__":
    execute_processing()
