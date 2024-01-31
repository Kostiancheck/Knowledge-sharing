use std::cmp::Ordering;
use std::fs::File;
use std::fs::OpenOptions;
use std::io::prelude::*;
use std::time::*;

struct Node {
    val: i32,
    left: Option<Box<Node>>,
    right: Option<Box<Node>>,
}

impl Node {
    pub fn insert(&mut self, value: i32) {
        let target: &mut Option<Box<Node>> = match value.cmp(&self.val) {
            Ordering::Less => &mut self.left,
            Ordering::Equal => &mut self.left,
            Ordering::Greater => &mut self.right,
        };
        match target {
            Some(ref mut node) => {
                node.insert(value);
            }
            None => {
                let node = Node {
                    val: value,
                    left: None,
                    right: None,
                };
                *target = Some(Box::new(node));
            }
        }
    }

    pub fn search(&self, target: &i32) -> Option<&Node> {
        match &target.cmp(&self.val) {
            Ordering::Equal => return Some(&self),
            Ordering::Less => match &self.left {
                Some(node) => node.search(target),
                None => None,
            },
            Ordering::Greater => match &self.right {
                Some(node) => node.search(target),
                None => None,
            },
        }
    }
}

struct BST {
    root: Node,
    // height: i32,
    // count: i32,
}

impl BST {
    pub fn insert(&mut self, value: i32) {
        let root = &mut self.root;
        root.insert(value);
    }

    pub fn search(&self, target: &i32) -> Option<&Node> {
        return self.root.search(target);
    }
}

fn create_bst(vec: &Vec<i32>) -> BST {
    let root_node = Node {
        val: vec[0],
        left: None,
        right: None,
    };
    let mut bst = BST {
        root: root_node,
        // height: 0,
        // count: 0,
    };

    for val in &vec[1..] {
        bst.insert(*val);
    }
    return bst;
}

pub fn fn_vec_example() -> std::io::Result<()> {
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

    let mut integers_vec = Vec::new();

    for val in split {
        let val_int: i32 = val.parse().unwrap();
        // println!("{}", val_int);
        integers_vec.push(val_int);
    }

    println!("Input integers count: {}", integers_vec.len());

    let mut tests_file = File::open("../tests.txt")?;
    let mut tests_string = String::new();
    tests_file.read_to_string(&mut tests_string)?;

    let tests_split = tests_string.split(",");

    let mut tests_integers_vec = Vec::new();

    for val in tests_split {
        let val_int: i32 = val.parse().unwrap();
        // println!("{}", val_int);
        tests_integers_vec.push(val_int);
    }

    println!("Tests count: {}", tests_integers_vec.len());

    println!("----------");

    for test in &tests_integers_vec {
        let now = Instant::now();

        for integer in &integers_vec {
            if *test == *integer {
                break;
            }
        }

        let elapsed_time = now.elapsed();

        write!(
            loop_results,
            "{},vector,{}\n",
            test,
            elapsed_time.as_nanos()
        )?;
        println!(
            "Searching for {} in vector took {} nanoseconds.",
            test,
            elapsed_time.as_nanos()
        );
    }

    println!("----------");

    let bst = create_bst(&integers_vec);

    for test in &tests_integers_vec {
        let now = Instant::now();

        let found_in_bst = bst.search(test);

        let elapsed_time = now.elapsed();
        write!(
            tree_results,
            "{},binary_tree,{}\n",
            test,
            elapsed_time.as_nanos()
        )?;
        println!(
            "Searching for {} in BST took {} nanoseconds. Found {}.",
            test,
            elapsed_time.as_nanos(),
            match found_in_bst {
                Some(node) => node.val,
                None => -1,
            }
        );
    }
    Ok(())
}
