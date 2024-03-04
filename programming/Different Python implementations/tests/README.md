1. Download pre-compiled PyPy binary from https://www.pypy.org/download.html
2. Unpack
3. Run like this: `pypy/bin/pypy main.py`

To compare execution time:
- `time python main.py`
- `time pypy/bin/pypy main.py`

To install libraries for pypy:
1. `pypy/bin/pypy -m ensurepip`
2. `pypy/bin/pypy -mpip install numpy`
// note: installation for pypy might be slower than usual