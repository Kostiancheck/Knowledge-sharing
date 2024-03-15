package main

import (
	"bufio"
	"encoding/csv"
	"fmt"
	"io"
	"os"
	"runtime"
	"strings"
	"time"
)

// Kostia's improvements

//1.23m
//1.10m allocate maps with size 2000, switch to pointers
//

type intermidiateStationStats_v2 struct {
	min, max, sum float64
	count         int64
}

func customAtof(s string) (float64, error) {
	var result float64
	var sign = 1.0
	var decimalFound bool

	for _, c := range s {
		if c == '-' {
			sign = -1
		} else if c == '.' {
			decimalFound = true
		} else if c >= '0' && c <= '9' {
			if decimalFound {
				result = result + (float64(c-'0') / 10)
			} else {
				result = result*10 + float64(c-'0')
			}
		} else {
			return 0, fmt.Errorf("invalid character found: %c", c)
		}
	}

	return result * sign, nil
}

func process_data_v2(inputPath string, outputPath string) error {
	maxGoroutines := runtime.NumCPU()

	chunks, err := calculateChunkBoundaries_v2(inputPath, maxGoroutines)

	if err != nil {
		return err
	}
	resultsCh := make(chan map[string]*intermidiateStationStats_v2, 2)
	for _, chunk := range chunks {
		go processTemperatureData_v2(chunk[0], chunk[1], inputPath, resultsCh)
	}

	totals := mergeResults_v2(resultsCh, chunks)

	stations := make([]string, 0, len(totals))
	for station := range totals {
		stations = append(stations, station)
	}
	fmt.Println(time.Now())
	fmt.Println("Writing results to csv file.")

	file, err := os.Create(outputPath)
	if err != nil {
		fmt.Println("Cannot make new csv file")
	}
	defer file.Close()

	w := csv.NewWriter(file)
	defer w.Flush()

	for _, station := range stations {
		s := totals[station]
		mean := s.sum / float64(s.count)
		err := w.Write([]string{station, fmt.Sprintf("%.3f", s.min), fmt.Sprintf("%.3f", mean), fmt.Sprintf("%.3f", s.max)})
		if err != nil {
			panic(err)
		}
	}
	fmt.Println(time.Now())
	return nil
}

func processTemperatureData_v2(start, end int64, filePath string, resultsCh chan map[string]*intermidiateStationStats_v2) {
	file, err := os.Open(filePath)

	if err != nil {
		panic(err)
	}
	defer file.Close()

	if _, err := file.Seek(start, 0); err != nil {
		panic(err)
	}

	scanner := bufio.NewScanner(file)
	stationStats := make(map[string]*intermidiateStationStats_v2, 2000)
	bytesRead := int64(0)

	for scanner.Scan() {
		line := scanner.Text()
		bytesRead += int64(len(line)) + 1 // +1 for newline character

		// Stop if we've reached or exceeded the end position
		if bytesRead > end-start {
			break
		}

		parts := strings.Split(line, ",")
		if len(parts) != 2 {
			continue
		}
		station, tempStr := parts[0], parts[1]
		temp, err := customAtof(tempStr)
		if err != nil {
			panic(err)
		}
		s, ok := stationStats[station]
		if !ok {
			s = &intermidiateStationStats_v2{
				min:   temp,
				max:   temp,
				sum:   temp,
				count: 1,
			}
			stationStats[station] = s
		} else {
			s.min = min(s.min, temp)
			s.max = max(s.max, temp)
			s.sum += temp
			s.count++
		}
	}

	if err := scanner.Err(); err != nil {
		panic(err)
	}

	resultsCh <- stationStats
}

func mergeResults_v2(resultCh chan map[string]*intermidiateStationStats_v2, chunks [][2]int64) map[string]intermidiateStationStats_v2 {
	totals := make(map[string]intermidiateStationStats_v2, 2000)
	for i := 0; i < len(chunks); i++ {
		result := <-resultCh
		for station, s := range result {
			ts, ok := totals[station]
			if !ok {
				totals[station] = intermidiateStationStats_v2{
					min:   s.min,
					max:   s.max,
					sum:   s.sum,
					count: s.count,
				}
				continue
			}
			ts.min = min(ts.min, s.min)
			ts.max = max(ts.max, s.max)
			ts.sum += s.sum
			ts.count += s.count
			totals[station] = ts
		}
	}
	return totals
}

func calculateChunkBoundaries_v2(filePath string, maxGoroutines int) ([][2]int64, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	fileInfo, err := file.Stat()
	if err != nil {
		return nil, err
	}
	fileSize := fileInfo.Size()

	sizePerProcessor := fileSize / int64(maxGoroutines)

	var chunkBoundaries [][2]int64
	var start, end int64

	for start = 0; start < fileSize; start = end {
		end = start + sizePerProcessor
		if end < fileSize {
			file.Seek(end, io.SeekStart)
			buffer := make([]byte, 1)
			for {
				_, err := file.Read(buffer)
				if err != nil {
					if err == io.EOF {
						end = fileSize
						break
					}
					return nil, err
				}
				if buffer[0] == '\n' {
					end, err = file.Seek(0, io.SeekCurrent)
					if err != nil {
						return nil, err
					}
					break
				}
			}
		} else {
			end = fileSize
		}
		chunkBoundaries = append(chunkBoundaries, [2]int64{start, end})
	}

	return chunkBoundaries, nil
}
