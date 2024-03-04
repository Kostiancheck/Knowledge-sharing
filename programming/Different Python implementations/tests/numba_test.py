from numba import njit
import numpy as np
import numpy.typing as npt
import time
import dis

@njit # you can pass (cache=True) option to decorator to avoid re-compiling function on each run
def go_fast(a: npt.NDArray[np.float64]) -> float:  # Function is compiled to machine code when called the first time
    trace = 0.0
    for i in range(a.shape[0]):  # Numba likes loops
        trace += np.tanh(a[i])  # Numba likes NumPy functions
    return a + trace


if __name__ == "__main__":
    go_fast(np.arange(1_000))
    dis.dis(go_fast)
    go_fast(np.arange(1_000))
    dis.dis(go_fast)
    # start = time.time()
    # go_fast(np.arange(10_000_000))
    # end = time.time()
    # print(f"execution time: {end - start}")