package main

import (
	"fmt"
	"os"
	"time"
)

type benchmarkFunc func(string, string) error
type funcOutputFile struct {
	function   benchmarkFunc
	outputFile string
}

var FILE_PATH = "../temperatures.csv"
var preparedData = []funcOutputFile{funcOutputFile{process_data, "results_illia.csv"}}

func main() {
	for _, data := range preparedData {
		start := time.Now()
		err := data.function(FILE_PATH, data.outputFile)
		if err != nil {
			fmt.Fprintf(os.Stderr, "error: %v\n", err)
			os.Exit(1)
		}
		end := time.Since(start)
		fmt.Printf("Overall time of executin for %s is %s\n", data.outputFile, end)
	}

}
