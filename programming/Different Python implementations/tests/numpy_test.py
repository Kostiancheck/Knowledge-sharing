import numpy as np

def complex_math(x: float) -> float:
    return np.sin(x) * 100 * np.log2(x)

if __name__=="__main__":
    arr = np.random.rand(100_000)
    np.random.shuffle(arr)

    complex_math_v = np.vectorize(complex_math)
    modified_arr = complex_math_v(arr)
    # print(modified_arr)