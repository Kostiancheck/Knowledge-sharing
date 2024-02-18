package main

import (
	"encoding/csv"
	"fmt"
	"io"
	"log"
	"os"
	"strings"
)

const SIZE_OF_FILE = 175376

var SEARCH_ITEMS = []string{"Zymosis", "Zone", "Yearly", "Yellow", "Xanthoprotein"}

func fillBuiltInMap(item string, m map[string]int) {
	_, exists := m[item]
	if exists {
		m[item] += 1
	} else {
		m[item] = 1
	}
}

func main() {
	ht := newHashTableConstructor(SIZE_OF_FILE, getHash)
	uniqueValues := make(map[string]int)
	f, err := os.Open("dict.csv")
	if err != nil {
		log.Fatal(err)
	}

	defer f.Close()

	csvReader := csv.NewReader(f)
	for {
		rec, err := csvReader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			log.Fatal(err)
		}
		key := rec[0]
		value := strings.Replace(rec[2], `"`, "", -1)
		ht.Set(key, value)
		fillBuiltInMap(key, uniqueValues)
	}
	for _, key := range SEARCH_ITEMS {
		fmt.Println(ht.Get(key))
	}
	counter := 0
	for _, value := range ht.Bucket {
		if value.Value != nil {
			counter++
		}
	}
	unique_word_counter := 0
	for _, value := range uniqueValues {
		unique_word_counter++
		value += 1
	}
	fmt.Println("Values in hashmap: ", counter)
	fmt.Println("Unique values in csv: ", unique_word_counter)
}
