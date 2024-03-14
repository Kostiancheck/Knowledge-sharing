package main

import (
	"bufio"
	"encoding/csv"
	"fmt"
	"io"
	"log"
	"os"
	"runtime"
	"strconv"
	"strings"
	"sync"
	"time"
)
import _ "net/http/pprof"

// TODO at the end try to switch to mmap
// TODO try to use pointers as much as possible to prevent data copy

type StationStats struct {
	// TODO try to optimize, maybe try to use other types since float is overhead
	// -99.9 <= temperature <= 99.9
	min   float32
	max   float32
	count uint16  // number of stations <=10,000
	sum   float32 // max temp 99.9 * max # of stations 10,000 = 999 000
}

type ByteRange struct {
	StartByte int64
	EndByte   int64
}

const MEGABYTE int64 = 1024 * 1024

type Configs struct {
	inputPath  string
	outputPath string
}

// pairs of (station name, station stat)
var stations = make(map[string]*StationStats, 10000)

func kostia() {
	log.SetFlags(log.LstdFlags | log.Lmicroseconds)
	//log.SetOutput(io.Discard)

	start := time.Now()
	log.Println("Current time is:")
	log.Println(start)
	log.Println("Hello world from Kostia")

	config := Configs{
		//inputPath: "../temperatures_test.csv",
		inputPath:  "../temperatures.csv",
		outputPath: "test_test.csv",
	}

	processCsv(config.inputPath)

	elapsed := time.Since(start)
	log.Printf("Processing took %s\n", elapsed)
	start = time.Now()

	writeResult(config.outputPath)

	elapsed = time.Since(start)
	fmt.Printf("Writing took %s", elapsed)

}
func processCsv(inputPath string) {
	// Open the CSV file
	file, err := os.Open(inputPath)
	if err != nil {
		log.Println("Error opening file:", err)
		return
	}

	fileStat, _ := file.Stat()
	fileSize := fileStat.Size()
	var chunkSize int64 = 100 * MEGABYTE
	log.Printf("File Size is %d bytes \n", fileSize)
	log.Printf("Number of CPUs %d \n", runtime.NumCPU())

	var recordsQueue = make(chan map[string]*StationStats, 100)

	// Create a wait group to wait for all goroutines to finish
	var wg sync.WaitGroup

	for _, chunk := range createChunks(chunkSize, fileSize) {
		wg.Add(1)
		go func() {
			processChunks(chunk, recordsQueue, inputPath)
			wg.Done()
		}()
		//log.Printf("Number of goroutines %d", runtime.NumGoroutine())
	}

	// Start a goroutine to wait for all worker goroutines to finish
	go func() {
		wg.Wait()
		close(recordsQueue) // Close the channel after all worker goroutines are done
	}()

	log.Println("Process records into final")
	processRecords(recordsQueue)
}

func createChunks(chunkSizeBytes int64, fileSizeBytes int64) []ByteRange {
	var chunks []ByteRange

	var startByte int64 = 0
	for startByte < fileSizeBytes {
		endByte := startByte + chunkSizeBytes
		if endByte > fileSizeBytes {
			endByte = fileSizeBytes
		}

		chunk := ByteRange{startByte, endByte}
		chunks = append(chunks, chunk)

		startByte = endByte + 1
	}

	return chunks
}

func processRecords(resultCh chan map[string]*StationStats) {
	for r := range resultCh {
		for station, stats := range r {
			stations[station] = stats
		}
	}
}

func processChunks(chunk ByteRange, recordsQueue chan map[string]*StationStats, filePath string) {
	file, _ := os.Open(filePath)
	var localStations = make(map[string]*StationStats, 10000)

	// Seek to the start of the chunk
	if _, err := file.Seek(chunk.StartByte, io.SeekStart); err != nil {
		log.Printf("Processing chunk (%d, %d)", chunk.StartByte, chunk.EndByte)
		panic(err)
	}

	if chunk.StartByte > 0 {
		// Seek to the nearest next newline character if startByte is not at the beginning of the file
		seekToNextNewline(file)
	}

	chunkSize := chunk.EndByte - chunk.StartByte
	scanner := bufio.NewScanner(file)

	var bytesRead int64 = 0
	for scanner.Scan() {
		line := scanner.Text()

		bytesRead += int64(len(line)) + 1 // +1 for newline character

		// Stop if we've reached or exceeded the end position
		if bytesRead > chunkSize {
			//log.Printf("Read %d bytes, chunk size %d. Finishing chunk processing", bytesRead, chunkSize)
			break
		}
		//log.Printf("Processing line %s", line)
		/////////////////////

		record := strings.Split(line, ",")

		stationName := record[0]
		// TODO try to optimize float parsing
		temperatureRaw, _ := strconv.ParseFloat(record[1], 32)
		temperature := float32(temperatureRaw)

		if _, ok := localStations[stationName]; !ok {
			stations[stationName] = &StationStats{
				min:   temperature,
				max:   temperature,
				count: 1,
				sum:   temperature,
			}
			continue
		} else {
			stationStat := localStations[stationName]

			if temperature < stationStat.min {
				stationStat.min = temperature
			}
			if temperature > stationStat.max {
				stationStat.max = temperature
			}

			stationStat.sum += temperature
			stationStat.count++
		}

		/////////////
	}

	recordsQueue <- localStations
}

func seekToNextNewline(file *os.File) {
	// Seek to the next newline character
	var buf [1]byte
	for {
		if _, err := file.Read(buf[:]); err != nil {
			if err == io.EOF {
				break
			}
			panic(err)
		}
		if buf[0] == '\n' {
			break
		}
	}
}

func writeResult(resultPath string) {
	csvFile, err := os.Create(resultPath)
	if err != nil {
		//log.Fatalf("failed creating file: %s", err)
	}

	defer func(csvFile *os.File) {
		err := csvFile.Close()
		if err != nil {

		}
	}(csvFile)
	csvwriter := csv.NewWriter(csvFile)

	for station, stat := range stations {
		// TODO optimize converting of stats into final string
		// remove double quotes
		// check results
		finalStatStr := []string{
			fmt.Sprintf("%s,%.2f,%.2f,%d,%.2f",
				station,
				stat.min,
				stat.sum,
				stat.count,
				stat.max),
		}

		_ = csvwriter.Write(finalStatStr)
	}
	csvwriter.Flush()

}
