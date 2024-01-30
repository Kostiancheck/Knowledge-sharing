## Task
1. Read list of unique integers from `integers.txt`. They are comma-separated. 
2. Create a balanced binary search tree where each node will represent a integer from the list.
3. Write a function to retrieve any given integer from balanced binary search tree. Return None if not found.
4. Read list of test integers from `tests.txt`. They are comma-separated and contain best-case, worst-case, 25th, 50th, 75th percentile and 3 random integers. Measure retrieval function performance VS for loop on unsorted list for given test integers.
5. Write results to `<programming_language>_<tree/loop>_results.csv` (e.g. `scala_loop_results.csv`) 
with the next columns `target, type, execution_time`:
   1. `target` - target value from [tests.txt](tests.txt)
   2. `type` - `list` or `binary_tree`
   3. `execution_time` - execution time in MICRO seconds

## Analysis 
1. create venv and install [requirements.txt](requirements.txt)
2. run `jupyter lab`
3. open in Jupyter Lab open [binary_tree_speed_analysis](binary_tree_speed_analysis.ipynb)
4. Run all cells and enjoy the charts
