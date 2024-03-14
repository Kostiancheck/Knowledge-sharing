package main

//
//import (
//	"encoding/csv"
//	"fmt"
//	"log"
//	"os"
//	"strconv"
//	"time"
//)
//
//type StationStats struct {
//	// TODO try to optimize, maybe try to use other types since float is overhead
//	// -99.9 <= temperature <= 99.9
//	min   float32
//	max   float32
//	count uint16  // number of stations <=10,000
//	sum   float32 // max temp 99.9 * max # of stations 10,000 = 999 000
//}
//
//// pairs of (station name, station stat)
//// TODO allocate entire map so it doesn't need to spend time for resize
//// TODO use pointers to Station Stats
//var stations = make(map[string]*StationStats)
//
//func kostia() {
//	start := time.Now()
//
//	fmt.Println("Hello world from Kostia")
//	processCsv()
//	elapsed := time.Since(start)
//	fmt.Printf("Processing took %s\n", elapsed)
//
//	start = time.Now()
//	writeResult()
//	elapsed = time.Since(start)
//
//	fmt.Printf("Writing took %s", elapsed)
//
//}
//
//func writeResult() {
//	csvFile, err := os.Create("test_test.csv")
//	if err != nil {
//		log.Fatalf("failed creating file: %s", err)
//	}
//
//	defer csvFile.Close()
//	csvwriter := csv.NewWriter(csvFile)
//
//	for station, stat := range stations {
//		// TODO optimize converting of stats into final string
//		// remove double quotes
//		// check results
//		finalStatStr := []string{
//			fmt.Sprintf("%s,%.2f,%.2f,%.d,%.2f",
//				station,
//				stat.min,
//				stat.sum,
//				stat.count,
//				stat.max),
//		}
//
//		_ = csvwriter.Write(finalStatStr)
//	}
//	csvwriter.Flush()
//
//}
//
//func processCsv() {
//	// Open the CSV file
//	file, err := os.Open("../temperatures_test.csv")
//	if err != nil {
//		fmt.Println("Error opening file:", err)
//		return
//	}
//	defer file.Close() // close after processCsv is finished
//
//	// Create a new CSV reader
//	reader := csv.NewReader(file)
//	var fileLine int32
//	// Read and process each record
//	for {
//		fileLine++
//		record, err := reader.Read()
//		if err != nil {
//			// Check for end of file
//			if err.Error() == "EOF" {
//				break
//			}
//			fmt.Println("Error reading record:", err)
//			return
//		}
//
//		processRecord(record)
//	}
//}
//
//func processRecord(record []string) {
//	stationName := record[0]
//
//	// TODO try to optimize float parsing
//	temperatureRaw, _ := strconv.ParseFloat(record[1], 32)
//	temperature := float32(temperatureRaw)
//
//	_, ok := stations[stationName]
//	// Check if the city exists in the map
//	if !ok {
//		// Initialize city data if it doesn't exist
//		stations[stationName] = &StationStats{
//			min:   temperature,
//			max:   temperature,
//			count: 0,
//			sum:   0.0,
//		}
//	}
//	stationStat := stations[stationName]
//
//	if temperature < stationStat.min {
//		stationStat.min = temperature
//	}
//	if temperature > stationStat.max {
//		stationStat.max = temperature
//	}
//
//	stationStat.sum += temperature
//	stationStat.count++
//}
