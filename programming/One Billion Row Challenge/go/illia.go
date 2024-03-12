package main

import (
	"bufio"
	"encoding/csv"
	"fmt"
	"io"
	"os"
	"runtime"
	"strconv"
	"strings"
)

type intermidiateStationStats struct {
	min, max, sum float64
	count         int64
}

func process_data(inputPath string, outputPath string) error {
	maxGoroutines := runtime.NumCPU()
	chunks, err := calculateChunkBoundaries(inputPath, maxGoroutines)
	if err != nil {
		return err
	}
	resultsCh := make(chan map[string]intermidiateStationStats)
	for _, chunk := range chunks {
		go processTemperatureData(chunk[0], chunk[1], inputPath, resultsCh)
	}

	totals := mergeResults(resultsCh, chunks)

	stations := make([]string, 0, len(totals))
	for station := range totals {
		stations = append(stations, station)
	}
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
	return nil
}

func processTemperatureData(start, end int64, filePath string, resultsCh chan map[string]intermidiateStationStats) {
	file, err := os.Open(filePath)
	if err != nil {
		panic(err)
	}
	defer file.Close()

	if _, err := file.Seek(start, 0); err != nil {
		panic(err)
	}

	scanner := bufio.NewScanner(file)
	stationStats := make(map[string]intermidiateStationStats)
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
		temp, err := strconv.ParseFloat(tempStr, 64)
		if err != nil {
			panic(err)
		}

		s, ok := stationStats[station]
		if !ok {
			s = intermidiateStationStats{
				min:   temp,
				max:   temp,
				sum:   temp,
				count: 1,
			}
		} else {
			s.min = min(s.min, temp)
			s.max = max(s.max, temp)
			s.sum += temp
			s.count++
		}
		stationStats[station] = s
	}

	if err := scanner.Err(); err != nil {
		panic(err)
	}

	resultsCh <- stationStats
}

func mergeResults(resultCh chan map[string]intermidiateStationStats, chunks [][2]int64) map[string]intermidiateStationStats {
	totals := make(map[string]intermidiateStationStats)
	for i := 0; i < len(chunks); i++ {
		result := <-resultCh
		for station, s := range result {
			ts, ok := totals[station]
			if !ok {
				totals[station] = intermidiateStationStats{
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

func calculateChunkBoundaries(filePath string, maxGoroutines int) ([][2]int64, error) {
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
