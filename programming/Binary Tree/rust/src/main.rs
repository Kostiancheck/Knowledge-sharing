use std::{fs::File, io::Write};

mod array_example;
mod vec_example;

fn main() -> std::io::Result<()> {
    let mut tree_results = File::create("../rust_tree_results.csv")?;
    tree_results.write_all("target,type,execution_time\n".as_bytes())?;
    let mut loop_results = File::create("../rust_loop_results.csv")?;
    loop_results.write_all("target,type,execution_time\n".as_bytes())?;

    array_example::fn_array_example()?;
    vec_example::fn_vec_example()?;
    Ok(())
}
