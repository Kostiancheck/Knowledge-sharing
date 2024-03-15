package main

import (
	"bufio"
	"encoding/csv"
	"fmt"
	"os"
	"strconv"
	"strings"
	"sync"
)

const CHUNK_SIZE int = 10_000_000 * 20
const MAX_CONCURRENT_THREADS int = 8

func get_chunks(file_name string) int {
	file, err := os.Open(file_name)
	if err != nil {
		panic(err)
	}
	defer file.Close()

	// Get file size
	file_info, err := file.Stat()
	if err != nil {
		panic(err)
	}
	file_size := file_info.Size()

	// Calculate number of chunks
	num_chunks := (int(file_size) + CHUNK_SIZE - 1) / CHUNK_SIZE
	return num_chunks
}

func read_and_process(file_name string, from_block int64, block_size int, wg *sync.WaitGroup, results chan<- map[string]map[string]float64) {

	defer wg.Done()

	file, err := os.Open(file_name)
	if err != nil {
		panic(err)
	}

	defer file.Close()

	_, err = file.Seek(from_block, 0)
	if err != nil {
		panic(err)
	}

	// Create a buffer to read the chunk size
	buffer := make([]byte, block_size)

	// Read a chunk of bytes
	_, err = file.Read(buffer)
	if err != nil {
		panic(err)
	}

	// Create a reader from the buffer
	reader := bufio.NewReader(strings.NewReader(string(buffer)))

	// cities := <-channel

	var cities = make(map[string]map[string]float64)

	// Read lines until EOF is reached
	for {
		line, err := reader.ReadString('\n')
		if err != nil {
			break // Break loop if EOF reached
		}
		parts := strings.Split(line, ",")
		if len(parts) < 2 {
			break // break if line finishes before ,
		}
		city := parts[0]
		temp_str := parts[1]
		temp, err := strconv.ParseFloat(strings.TrimSpace(temp_str), 64)
		if err != nil {
			fmt.Println("Error:", err)
			return
		}

		_, ok := cities[city]
		if ok {
			if temp < cities[city]["min"] {
				cities[city]["min"] = temp
			}
			if temp > cities[city]["max"] {
				cities[city]["max"] = temp
			}
			cities[city]["sum"] += temp
			cities[city]["count"] += 1
		} else {
			cities[city] = make(map[string]float64)
			cities[city]["min"] = temp
			cities[city]["max"] = temp
			cities[city]["sum"] = temp
			cities[city]["count"] = 1
		}
	}

	results <- cities

	fmt.Println("Processed block", from_block)
}

func process_data_bh(input_path string, output_path string) {
	var wg sync.WaitGroup

	fmt.Println("Hello, World!")
	var chunks int = get_chunks(input_path)
	fmt.Println(chunks)

	results := make(chan map[string]map[string]float64)

	cities := make(map[string]map[string]float64) // output result

	for i := 0; i < chunks; i++ {
		wg.Add(1)
		go read_and_process(input_path, int64(i), CHUNK_SIZE, &wg, results)
		if (i%MAX_CONCURRENT_THREADS == 0) && (i >= MAX_CONCURRENT_THREADS) || i == chunks-1 {
			go func() {
				wg.Wait()
				close(results)
			}()

			cities = make(map[string]map[string]float64)

			for res := range results {
				for city, val := range res {
					_, ok := cities[city]
					if ok {
						if val["min"] < cities[city]["min"] {
							cities[city]["min"] = val["min"]
						}
						if val["max"] > cities[city]["max"] {
							cities[city]["max"] = val["max"]
						}
						cities[city]["sum"] += val["sum"]
						cities[city]["count"] += val["count"]
					} else {
						cities[city] = make(map[string]float64)
						cities[city]["min"] = val["min"]
						cities[city]["max"] = val["max"]
						cities[city]["sum"] = val["sum"]
						cities[city]["count"] = val["count"]
					}
				}
			}

			results = make(chan map[string]map[string]float64)
		}
	}

	// for city, values := range cities {
	// 	fmt.Println(city, ",", values["min"], ",", values["sum"]/values["count"], ",", values["max"])
	// }

	file, err := os.Create(output_path)
	if err != nil {
		fmt.Println("Cannot make new csv file")
	}
	defer file.Close()

	w := csv.NewWriter(file)
	defer w.Flush()

	for city, values := range cities {
		w.Write([]string{city, fmt.Sprintf("%.3f", values["min"]), fmt.Sprintf("%.3f", values["sum"]/values["count"]), fmt.Sprintf("%.3f", values["max"])})
	}

	fmt.Println("done")
}

// func main() {
// 	process_data_bh("../../temp_min.csv", "test.csv")
// }
