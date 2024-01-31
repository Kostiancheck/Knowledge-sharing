use std::fs::File;
use std::fs::OpenOptions;
use std::io::prelude::*;
use std::time::*;

const SIZE: usize = 200_000;
const BASE: usize = 2;
const BST_SIZE: usize = BASE.pow(SIZE.ilog2() + 1) - 1;

pub fn convert_array_to_bst(initial_array: &mut [i32]) -> [i32; BST_SIZE] {
    let array = initial_array.as_mut();
    array.sort();

    let mut bst = [-1; BST_SIZE];

    pub fn convert_to_bst(
        bst: &mut [i32; BST_SIZE],
        array: &[i32],
        start: usize,
        end: usize,
        root_index: usize,
    ) {
        if start <= end {
            let mid: usize = (start + end) / 2;
            bst[root_index] = array[mid];
            if mid > 0 {
                convert_to_bst(bst, array, start, mid - 1, 2 * root_index + 1);
            }
            convert_to_bst(bst, array, mid + 1, end, 2 * root_index + 2);
        }
    }

    convert_to_bst(&mut bst, array, 0, array.len() - 1, 0);
    return bst;
}

pub fn search_bst(bst: &[i32], val: i32, index: usize) -> Option<i32> {
    if index < bst.len() && bst[index].is_positive() {
        if bst[index] == val {
            return Some(val);
        } else if bst[index] < val {
            return search_bst(bst, val, 2 * index + 2);
        } else {
            return search_bst(bst, val, 2 * index + 1);
        }
    };
    return None;
}

pub fn fn_array_example() -> std::io::Result<()> {
    let mut tree_results = OpenOptions::new()
        .append(true)
        .open("../rust_tree_results.csv")
        .unwrap();
    let mut loop_results = OpenOptions::new()
        .append(true)
        .open("../rust_loop_results.csv")
        .unwrap();

    let mut file = File::open("../integers.txt")?;
    let mut contents = String::new();
    file.read_to_string(&mut contents)?;
    // println!("{}", contents);

    let split = contents.split(',');

    let mut integers_array = [0; SIZE];

    for (i, val) in split.enumerate() {
        let val_int: i32 = val.parse().unwrap();
        // println!("{}", val_int);
        integers_array[i] = val_int;
    }

    println!("Input integers count: {}", integers_array.len());

    let mut tests_file = File::open("../tests.txt")?;
    let mut tests_string = String::new();
    tests_file.read_to_string(&mut tests_string)?;

    let tests_split = tests_string.split(",");

    let mut tests_integers_array = [0; 17];

    for (i, val) in tests_split.enumerate() {
        let val_int: i32 = val.parse().unwrap();
        // println!("{}", val_int);
        tests_integers_array[i] = val_int;
    }

    println!("Tests count: {}", tests_integers_array.len());

    println!("----------");

    for test in tests_integers_array {
        let now = Instant::now();

        for integer in integers_array {
            if test == integer {
                break;
            }
        }

        let elapsed_time = now.elapsed();
        write!(
            loop_results,
            "{},array,{}\n",
            test,
            elapsed_time.as_nanos()
        )?;
        println!(
            "Searching for {} in array took {} nanoseconds.",
            test,
            elapsed_time.as_nanos()
        );
    }

    println!("----------");

    let bst = convert_array_to_bst(&mut integers_array);

    for test in &tests_integers_array {
        let now = Instant::now();

        let found_in_bst = search_bst(&bst, *test, 0);

        let elapsed_time = now.elapsed();
        write!(
            tree_results,
            "{},bst_array,{}\n",
            test,
            elapsed_time.as_nanos()
        )?;
        println!(
            "Searching for {} in bst array took {} nanoseconds. Found {}",
            test,
            elapsed_time.as_nanos(),
            match found_in_bst {
                Some(val) => val,
                None => -1,
            }
        );
    }

    println!("----------");

    Ok(())
}
