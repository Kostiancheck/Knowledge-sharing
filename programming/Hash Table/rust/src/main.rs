use std::{
    collections::hash_map::DefaultHasher,
    hash::{Hash, Hasher},
};
use std::fmt::Display;
use std::fs::{File, OpenOptions};
use std::io::Write;
use std::time::Instant;

// hardcoded value. Equals to number of words in csv file * 1.3
const DEFAULT_MAX_SIZE: usize = 227989;


pub struct CustomHashTable<T: Display, V: Display> {
    curr_size: usize,
    // use vector instead of array to store value in heap but not in stack to prevent stuck overflow error
    arr: Vec<Option<KeyValue<T, V>>>,
}

#[derive(Clone)] // need to be able to resize Vector
pub struct KeyValue<T: Display, V: Display> {
    key: T,
    value: V,
}

impl<T: Eq + Hash + Clone + Display, V: Clone + Display> CustomHashTable<T, V> {
    pub fn new() -> CustomHashTable<T, V> {
        let mut v = Vec::with_capacity(DEFAULT_MAX_SIZE);
        v.resize(DEFAULT_MAX_SIZE, None);
        CustomHashTable {
            curr_size: 0,
            arr: v,
        }
    }

    /// Inserts a key: value pair into the hashmap
    ///
    /// Returns None if the key didn't exist
    /// Returns the old value if the key wasn't present
    /// and updates it with the new value.
    pub fn put(&mut self, key: T, value: V) -> () {
        let hash_val: u64 = hash_key(&key);

        let position = hash_val % DEFAULT_MAX_SIZE as u64;
        // Debug purposes only, to see examples of collisions
        // match &self.arr[position as usize] {
        //     Some(kv) => println!("Previous key: {} New key: {}. Hash value same for both: {}", kv.key, key, hash_val),
        //     None => print!("")
        // }

        self.arr[position as usize] = Some(KeyValue::new(key, value));
        self.curr_size += 1;
    }

    /// Gets the given value for a key.
    ///
    /// Returns the value if it exists
    /// None otherwise
    pub fn get(&self, key: T) -> Option<V> {
        let hash_val: u64 = hash_key(&key);
        let position = hash_val % DEFAULT_MAX_SIZE as u64;

        match &self.arr[position as usize] {
            // if entry exists and key is the same
            Some(kv) if kv.key == key => Some(kv.value.clone()),
            _ => None
        }
    }


    /// Returns the number of keys in
    /// the HashMap
    pub fn length(&self) -> usize {
        self.curr_size
    }
}

impl<T: Display, V: Display> KeyValue<T, V> {
    pub fn new(key: T, value: V) -> KeyValue<T, V> {
        KeyValue { key, value }
    }
}

fn hash_key<T: Hash>(key: &T) -> u64 {
    let mut hasher = DefaultHasher::new();
    key.hash(&mut hasher);

    hasher.finish()
}

fn main() {
    let now = Instant::now();

    let mut my_hash = CustomHashTable::new();
    let filename = "../dict.csv";
    let file = File::open(filename).unwrap();
    let mut rdr = csv::Reader::from_reader(file);

    let elapsed_time = now.elapsed();
    println!("Creation elapsed time {:?}", elapsed_time);
    let now = Instant::now();
    for result in rdr.records() {
        let record = match result {
            Ok(record) => record,
            Err(_) => continue,
        };
        my_hash.put(record[0].to_string(), record[2].to_string().replace("\"", ""));
    }
    let elapsed_time = now.elapsed();
    println!("Inserting elapsed time {:?}", elapsed_time);

    println!("{} - {}", "A", my_hash.get("A".to_string()).unwrap_or_else(|| "¯\\_(ツ)_/¯".to_string()));
    println!("{} - {}", "bruh", my_hash.get("bruh".to_string()).unwrap_or_else(|| "¯\\_(ツ)_/¯".to_string()));
    println!("{} - {}", "bra;sodjkfhnwei;ovuh", my_hash.get("bra;sodjkfhnwei;ovuh".to_string()).unwrap_or_else(|| "¯\\_(ツ)_/¯".to_string()));
    println!("{} - {}", "Trumpery", my_hash.get("Trumpery".to_string()).unwrap_or_else(|| "¯\\_(ツ)_/¯".to_string()));
    println!("{} - {}", "Empurple", my_hash.get("Empurple".to_string()).unwrap_or_else(|| "¯\\_(ツ)_/¯".to_string()));
    println!("{} - {}", "Trap", my_hash.get("Trap".to_string()).unwrap_or_else(|| "¯\\_(ツ)_/¯".to_string()));

    println!("================= Check number of words in hash table =================");

    println!("Curr size {}", my_hash.curr_size);
    println!("Array len {}", my_hash.arr.iter().filter(|&x| x.is_some()).count());


    println!("================= Write final hash table to csv =================");

    let mut tree_results = File::create("../rust_hash_map_results.csv").unwrap();
    tree_results.write_all("word,definition\n".as_bytes()).unwrap();

    let mut results = OpenOptions::new()
        .append(true)
        .open("../rust_hash_map_results.csv")
        .unwrap();

    for pair in my_hash.arr {
        match pair {
            Some(kv) => write!(results, "{}, \"\"\"{}\"\"\"\n", kv.key, kv.value).unwrap(),
            _ => continue
        }
    };

    println!("\n");

    println!("================= Collision examples =================");
    println!("Word 1 has: {} {}, word 2 hash: {} {}", "Materialized", hash_key(&"Materialized") % DEFAULT_MAX_SIZE as u64, "Zymologist", hash_key(&"Zymologist") % DEFAULT_MAX_SIZE as u64);

    println!("Word 1 has: {} {}, word 2 hash: {} {}", "Grackle", hash_key(&"Grackle") % DEFAULT_MAX_SIZE as u64, "Zylonite", hash_key(&"Zylonite") % DEFAULT_MAX_SIZE as u64);

    println!("Word 1 has: {} {}, word 2 hash: {} {}", "Ae", hash_key(&"Ae") % DEFAULT_MAX_SIZE as u64, "Zincked", hash_key(&"Zincked") % DEFAULT_MAX_SIZE as u64);
}