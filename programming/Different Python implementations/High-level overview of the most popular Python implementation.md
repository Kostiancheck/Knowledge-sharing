DISCLAIMER: I am a JUNIOR dev. I ~~might be~~ definitely am wrong about certain things here. If you find any mistakes, feel free to reach out to me at bohdan.kholodenko@gmail.com and I'll fix it.

# Introduction
There are dozens^[Python implementations list - https://wiki.python.org/moin/PythonImplementations] of different Python implementations. We will focus on the most popular ones, as there is more info available on them. Although I'm sure somewhere someone very smart is working on a new even better implementation which is yet to be seen by the world. For now, we will focus on following implementations:
1. CPython (of course) - https://github.com/python/cpython
2. MicroPython - https://micropython.org/
3. Jython - https://www.jython.org/
4. RustPython - https://rustpython.github.io/
5. IronPython - https://ironpython.net/
6. Cython - https://cython.org/
7. PyPy - https://www.pypy.org/#, https://github.com/pypy/pypy
8. \*Numba - https://numba.pydata.org/

Each implementation has some strong motivation behind it. Otherwise, why would someone invest so much time and effort writing it? Our first goal will be figuring out the motivations.

\* Numba is not an implementation of Python, but I think it's worth a mention in this context.
# Implementations
## CPython
CPython is the original, reference implementation of Python in C. So I'll skip it.


## MicroPython
MicroPython is a lean and efficient implementation of Python in C that includes a small subset of the standard library and is optimised to run on microcontrollers.

So, it looks like Python, and you can do stuff like this:
``` python
import json
data = json.loads('{"test": 1}')
```

But the actual code being called in .loads method will be [different](https://github.com/micropython/micropython-lib/blob/ffb07dbce52371a113da82e3d2deec447c2b61a5/python-stdlib/json/json/__init__.py#L346) compared to CPython stdlib [version](https://github.com/python/cpython/blob/bea2795be2c08dde3830f987830414f3f12bc1eb/Lib/json/__init__.py#L299) and therefore sometimes behavior might be different.

But remember, Python (even optimized MicroPython) is slow, and you should still call performance-critical stuff from C libraries.
> QR code generation proves that with plain C and with MicroPython bindings, the performance is identical - 11.5ms. MicroPython is slow, and if the QR code library was written in pure MicroPython, it would take 1500ms. Therefore, it is critical to put performance demanding code in C/C++ modules and compile a MicroPython bindings. - https://news.ycombinator.com/item?id=24166861

The primary use cases for this kind of apps is writing medium-to-large embedded applications which will be run on small but not exactly microscopic machine. So I would think TV OS would fit or maybe washing machine controllers? 
> Now that one can buy a 100+ MHz 32b CPU with 256KB RAM and 1MB of FLASH for $5 (and dropping), using assembly or C to make it fit into an 8b PIC with 2KB of RAM to save $3 isn't a worthwhile trade off for many applications.  - https://news.ycombinator.com/item?id=11183437

If you are like me and have no idea what embedded development looks like, you might want to take a look at this video (Raspberry Pi & MicroPython) https://www.youtube.com/watch?v=7T_HoOdNBkg

## Jython / RustPython / IronPython
The idea behind these three Python implementations is integrating Python into other languages, thus expanding its possibilities.

For example, Jython allows running Python on the JVM, so you can use it to deliver your Python app to several platforms at once! Also, Jython enables access to Java libraries.

>  We used Jython very extensively at a former employer, a high frequency trading firm. Originally it was to be used as a configuration language, to allow traders to easily write scripts that configured trading strategies written in Java. The scripts grew into a monstrous ecosystem of applications and analytics. Jython stuck on Python 2 and doesn't have great interop with the rest of the world Python ecosystem, so I wouldn't recommend it for a new project, but it was a big force multiplier in that use case. - https://news.ycombinator.com/item?id=39287936

I've read several mentions of same exact use case for Jython: as a scripting layer for enormous Java applications.

Real world example: Oracle FDMEE (Financial Data Quality Management, Enterprise Edition). Their primary way of passing data around various proprietary enterprise Oracle apps is via Jython scripts^[Jython scripts for FDMEE tutorial - https://www.youtube.com/watch?v=g1h2bUaMCWg&list=PLhLZjzDQsPeHI38-nL1CIA0RwOXYpLfyv&index=2].

RustPython is basically the same but for Rust. But for most use cases [PyO3](https://pyo3.rs/v0.15.1/) Rust bindings for Python will do the job. So I would imagine you'd want to use RustPython only in cases when you need to interact with Rust code directly from Python or compile Python to WebAssembly^[Github discussion on why RustPython if we have PyO3 - https://github.com/PyO3/pyo3/issues/435]. 

IronPython - for .NET. But from what I understand, ["Python for .NET"](https://pythonnet.github.io/) which is a package for integrating Python (CPython) with .NET runtime is more popular and more actively maintained, while not being an actual Python implementation.

Although, all of them seem to be quite unpopular. Development is lacking behind CPython for at least a couple of minor versions. Community discussions are rare. The main problems that these solutions try to solve are not that common I guess.
## PyPy
PyPy is written in RPython and Python. Yeah, I know it sounds ridiculous.

RPython (Restricted Python) *language* is a subset of Python which can be statically compiled into C with RPython *toolchain*. 
RPython *toolchain* even includes cool things like automatic JIT compiler generation and automatic VM generation for efficient interpreting.
Small note: the goal of RPython project is more ambitious, as they want to support different compiler backends and different target "platforms" (languages).

With RPython, PyPy compiles core interpreter. Then, when PyPy runs, it interprets parts written in Python (standard libs, "utilities" etc) with itself, i.e. PyPy core interpreter.

The core idea behind PyPy was introducing a [just-in-time (JIT) compiler](obsidian://open?vault=Knowledge-sharing&file=programming%2FDifferent%20Python%20implementations%2FJIT%20compiler) to Python. Recently, CPython^[Python gets a JIT - https://tonybaloney.github.io/posts/python-gets-a-jit.html] added support for JIT as well. But, as far as I understand, performance benefits of JIT compiler depend on specific implementation, and right now CPython has a lightweight^[Part of the reason why there's a negligible performance impact right now is because it purposefully omits lots of "obvious" performance improvements in order to keep the initial JIT implementation as small and easy-to-review as possible. - https://github.com/python/cpython/pull/113465] version of JIT, lacking many features. So, PyPy should have a more mature and efficient JIT since they've been working on it for years.

> **the case where PyPy works best is when executing long-running programs where a significant fraction of the time is spent executing Python code**

The reason for this is JIT compiler. The way it improves performance is by optimizing execution of **Python** bytecode. It does not improve the efficiency of C functions that Python calls extensively.

> Numpy and other C extensions that heavily use the CPython API (as opposed to the CFFI^[C Foreign Function Interface for Python - https://cffi.readthedocs.io/en/latest/]) are known to be slower under PyPy. That's probably not ever going to be a strong area for it.



## Cython
Cython is a compiled superset of Python. 

>- write Python code that [calls back and forth](http://docs.cython.org/src/tutorial/external.html) from and to C or C++ code natively at any point.
>- easily tune readable Python code into plain C performance by [adding static type declarations](http://docs.cython.org/src/quickstart/cythonize.html), also [in Python syntax](http://docs.cython.org/en/latest/src/tutorial/pure.html#static-typing).

It is typically used to generate CPython extension modules. Annotated Python-like code is compiled to C (also usable from e.g. C++) and then automatically wrapped in interface code, producing extension modules that can be loaded and used by regular Python code using the import statement, but with significantly less computational overhead at run time. 

> The Cython language is a superset of the **Python** language that additionally supports calling **C functions** and declaring **C types** on variables and class attributes. This allows the compiler to generate very **efficient C code** from Cython code. The C code is **generated once** and then compiles with all major C/C++ compilers in [CPython](http://python.org) 2.6, 2.7 (2.4+ with Cython 0.20.x) as well as 3.5 and all later versions.

It is much more widely adopted than Jython/RustPython/IronPython and is under active development.

A lot of computation-heavy libraries utilize Cython: SciPy, numpy, pandas and scikit-learn. Also, lxml module.

![[Pasted image 20240301104848.png]]

As I already said, it is typically used to compile C extensions that are later called from Python. In this space, another project exists: [mypyc](https://github.com/mypyc/mypyc) which is used to compile [mypy](https://www.mypy-lang.org/) static type checker.

# Honorary mention
## Numba
Numba is a JIT compiler that translates a subset of Python and NumPy code into fast machine code. It's based on famous LLVM compiler library.

So it's NOT an implementation of Python, just an additional JIT compiler you can use to improve performance of your numpy code.

It's installed via `pip`. The only changes to code you need to make is to wrap your computation-heavy function with `jit` decorator, so Numba knows what to compile.

The way it works is that it **compiles** a function into machine code and saves it into cache. Every time this function is called, it executes compiled machine code directly, rather than executing Python bytecode line by line.

![[Pasted image 20240301110129.png]]
# Additional links
1. The Python Language Reference https://docs.python.org/3/reference/index.html#reference-index
2. RustPython HN 2024.02.06 https://news.ycombinator.com/item?id=39286458
3. JIT compilation https://en.wikipedia.org/wiki/Just-in-time_compilation
4. Mypyc https://github.com/mypyc/mypyc
5. Ask HN: Is anyone using PyPy for real work? https://news.ycombinator.com/item?id=36940871
6. RPython toolchain overview https://rpython.readthedocs.io/en/latest/translation.html
7. PyPy - generating JIT for regular expressions https://www.pypy.org/posts/2010/06/jit-for-regular-expression-matching-3877859053629057968.html
# Footnotes