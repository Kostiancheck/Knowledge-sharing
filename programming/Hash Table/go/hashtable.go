package main

import (
	fnv "hash/fnv"
	"math"
)

const SIZE_MODIFIER float64 = 1.3

func toBytes(text string) []byte {
	return []byte(text)
}

func getHash(b []byte) uint64 {
	hash := fnv.New64a()
	hash.Write(b)
	return hash.Sum64()
}

type KeyVal struct {
	Key   interface{}
	Value interface{}
}

type HashTable struct {
	BucketSize int
	FilledSize int
	Bucket     []KeyVal
	LoadFactor int
	HashFunc   func([]byte) uint64
}

func (ht *HashTable) Set(key string, value interface{}) {
	// here we can check if our hashtable is about to overflow and make it bigger and re-distribute the Key-val pairs
	hash := ht._hash(key)
	// here we can check if this key is in hashtable and if it is, just update the value
	ht.Bucket[hash] = KeyVal{Key: key, Value: value}
}

func (ht *HashTable) Get(Key string) interface{} {
	hash := ht._hash(Key)
	value := ht.Bucket[hash]
	return value.Value
}

func (ht *HashTable) _hash(key string) int {
	key_in_bytes := toBytes(key)
	hash := ht.HashFunc(key_in_bytes)
	return int(hash % uint64(ht.BucketSize))
}

func newHashTableConstructor(BucketSize float64, HashFunc func([]byte) uint64) *HashTable {
	BucketSizeInner := int(math.Ceil(BucketSize * SIZE_MODIFIER))
	return &HashTable{
		BucketSize: BucketSizeInner,
		Bucket:     make([]KeyVal, BucketSizeInner),
		HashFunc:   HashFunc,
	}
}
