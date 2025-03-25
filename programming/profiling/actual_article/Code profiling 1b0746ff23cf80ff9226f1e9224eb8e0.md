# Code profiling

Created: March 8, 2025 11:49 AM
Owner: Din Lester
Tags: python
Status: Next Wednesday
Last edited time: March 25, 2025 7:15 PM

> Make it work, then make it beautiful, then if you really, really have to, make it fast. 90 percent of the time, if you make it beautiful, it will already be fast. So really, just make it beautiful! ([Source](https://henrikwarne.com/2021/04/16/more-good-programming-quotes-part-5/))
> 
> 
> — *Joe Armstrong (creator of Erlang)*
> 

[Software profiling](https://en.wikipedia.org/wiki/Profiling_(computer_programming)) is the process of collecting and analyzing various metrics of a running program to identify performance bottlenecks known as **hot spots**. These hot spots can happen due to a number of reasons, including excessive memory use, inefficient CPU utilization, or a suboptimal data layout, which will result in frequent [cache misses](https://en.wikipedia.org/wiki/CPU_cache#Cache_miss) that increase [latency](https://en.wikipedia.org/wiki/Latency_(engineering)).

Different profilers awailable in python:

- **Timers** like the `time` and `timeit` standard library modules, or the `codetiming` third-party package
- **Deterministic profilers** like `profile`, `cProfile`, and line_profiler
- **Statistical profilers** like Pyinstrument and the Linux `perf` profiler

### [Time module](https://docs.python.org/3/library/time.html)

```python
>>> import time

>>> def sleeper():
...     time.sleep(1.75)
...

>>> def spinlock():
...     for _ in range(100_000_000):
...         pass
...

>>> for function in sleeper, spinlock:
...     t1 = time.perf_counter(), time.process_time()
...     function()
...     t2 = time.perf_counter(), time.process_time()
...     print(f"{function.__name__}()")
...     print(f" Real time: {t2[0] - t1[0]:.2f} seconds")
...     print(f" CPU time: {t2[1] - t1[1]:.2f} seconds")
...     print()
...
sleeper()
 Real time: 1.75 seconds
 CPU time: 0.00 seconds

spinlock()
 Real time: 1.77 seconds
 CPU time: 1.77 seconds
```

We can write our own decorators, or use [codetiming package](https://pypi.org/project/codetiming/) (or similar, but I prefer to write own, because it’s now such hard to do and we don’t need to handle more dependencies 🙃 )

### [Timeit module](https://docs.python.org/3/library/timeit.html)

When measuring code performance, Python's built-in `timeit` module is your best ally. It eliminates common measurement errors by:

1. Running your code multiple times to get statistically sound results
2. Disabling garbage collection during timing runs
3. Minimizing interference from system load and concurrent processes

This approach gives you much more reliable execution time measurements than manual timing methods. Rather than wondering if your results were affected by background processes or garbage collection cycles, `timeit` provides cleaner, more consistent benchmarks you can actually trust.

```python
>>> from timeit import timeit

>>> def fib(n):
...     return n if n < 2 else fib(n - 2) + fib(n - 1)
...

>>> iterations = 100
>>> total_time = timeit("fib(30)", number=iterations, globals=globals())

>>> f"Average time is {total_time / iterations:.2f} seconds"
'Average time is 0.18 seconds'
```

While `timeit` allows you to benchmark a particular code snippet by measuring the execution time, it falls short when you want to collect more detailed metrics to find bottlenecks. Fortunately, Python ships with a more sophisticated profiler tool that you’ll explore next.

### [cProfile module](https://docs.python.org/3/library/profile.html)

It can help you answer questions like how many times a particular function was called or how much total time was spent inside that function. A deterministic profiler can give you reproducible results under the same conditions because it traces *all* function calls in your program.

```python
>>> from cProfile import Profile
>>> from pstats import SortKey, Stats

>>> def fib(n):
...    return n if n < 2 else fib(n - 2) + fib(n - 1)

>>> with Profile() as profile:
...    print(f"{fib(35) = }")
...    Stats(profile).strip_dirs().sort_stats(SortKey.CALLS).print_stats()
 
 
fib(35) = 9227465
         29860712 function calls (10 primitive calls) in 5.106 seconds

   Ordered by: call count

   ncalls  tottime  percall  cumtime  percall filename:lineno(function)
29860703/1    5.106    0.000    5.106    5.106 profile_cprofile.py:5(fib)
        1    0.000    0.000    0.000    0.000 {built-in method builtins.hasattr}
        1    0.000    0.000    0.000    0.000 {built-in method builtins.isinstance}
        1    0.000    0.000    0.000    0.000 {built-in method builtins.len}
        1    0.000    0.000    0.000    0.000 {built-in method builtins.print}
        1    0.000    0.000    0.000    0.000 cProfile.py:51(create_stats)
        1    0.000    0.000    0.000    0.000 pstats.py:107(__init__)
        1    0.000    0.000    0.000    0.000 pstats.py:117(init)
        1    0.000    0.000    0.000    0.000 pstats.py:136(load_stats)
        1    0.000    0.000    0.000    0.000 {method 'disable' of '_lsprof.Profiler' objects}
```

The output is quite verbose, but it tells you that your program took over five seconds to finish while making exactly 29_860_712 function calls. Only ten of them were **primitive** or non-recursive calls, including just one non-recursive call to `fib()`. All the others were calls from `fib()` to itself.

From [official doc](https://docs.python.org/3/library/profile.html#instant-user-s-manual):

- ncallsfor the number of calls.
- tottimefor the total time spent in the given function (and excluding time made in calls to sub-functions)
- percallis the quotient of `tottime` divided by `ncalls`
- cumtime is the cumulative time spent in this and all subfunctions (from invocation till exit). This figure is accurate *even* for recursive functions.
- percallis the quotient of `cumtime` divided by primitive callsfilename:lineno(function)provides the respective data of each function

> *The `pstats` module allows you to format, sort, and display the profile statistics you've collected. It becomes particularly valuable when you save statistics to a binary file, as you can then use `pstats` interactively in the terminal to explore and analyze the file's contents.*
> 

```python
>>> import pstats

>>> stats = pstats.Stats("cprofile_stats.txt")

>>> stats.sort_stats('cumulative').print_stats(20)  # Shows top 20 functions

>>> stats.sort_stats('time').print_stats(10)        # Top 10 by internal time
>>> stats.sort_stats('calls').print_stats(10)       # Top 10 by call count

>>> stats.print_callers('function_name')

>>> stats.print_callees('function_name')

>>> stats.sort_stats('cumulative').print_stats(.05)  # Top 5% of functions
```

[*Docs about sorting stats*](https://docs.python.org/3/library/profile.html#pstats.Stats.sort_stats)

- Some words about deterministic profiling
    
    *Deterministic profiling* tracks every *function call*, *function return*, and *exception* event with precise timing between these events (when your code is actually running). This differs from *statistical profiling*, which samples the instruction pointer randomly to estimate where time is spent. Statistical approaches typically have lower overhead since they don't require code instrumentation, but only provide relative time indicators.
    
    Python's interpreted nature creates a unique advantage: deterministic profiling doesn't require special code instrumentation because Python already provides event hooks (optional callbacks) for each event. Since the Python interpreter already adds significant execution overhead, the additional impact of deterministic profiling is relatively small in typical applications. 🤣 This gives you comprehensive runtime statistics without excessive performance penalties.
    
    The statistics collected serve multiple purposes:
    
    - Call counts help identify bugs (unexpected counts) and potential inline-expansion opportunities (high call counts)
    - Internal time statistics reveal "hot loops" that need optimization
    - Cumulative time statistics help detect high-level algorithm selection issues
    
    The profiler's special handling of cumulative times allows direct comparison between recursive and iterative implementations of algorithms.
    

### [Pyinstrument module](https://pyinstrument.readthedocs.io/en/latest/) (external one)

To lower the profiler's overhead, you can use statistical profiling and only collect metrics once in a while. This works by taking a snapshot of the running program's state at specified intervals. Each time, the profiler records a **sample** consisting of the entire call stack from the currently executing function all the way up to the top ancestor in the call hierarchy.

A **deterministic profiler** tracks every function call, creating significant overhead that varies with call frequency and produces noisy results with potential distortions. In contrast, a **statistical profiler** samples at regular intervals, filtering out **insignificant** calls with consistent, adjustable overhead. With appropriate sampling rates, brief functions may not appear in reports, helping you focus on what truly impacts performance.

> *To use a statistical profiler in Python, you'll need to install a third-party tool like `Pyinstrument` or `py-spy.` Some of them are better than others depending on the use case. For example, `Pyinstrument` can't handle code that runs in multiple threads or calls functions implemented in C extension modules, such as `NumPy` or `pandas`.*
> 

```python
>>> from random import uniform

>>> def estimate_pi(n):
...     return 4 * sum(hits(point()) for _ in range(n)) / n
...

>>> def hits(point):
...     return abs(point) <= 1
...

>>> def point():
...     return complex(uniform(0, 1), uniform(0, 1))
...

>>> for exponent in range(1, 8):
...     n = 10 ** exponent
...     estimates = [estimate_pi(n) for _ in range(5)]
...     print(f"{n = :<10,} {estimates}")
...

>>> with Profiler(interval=0.1) as profiler:
...    estimate_pi(n=10_000_000)

>>> profiler.print()

n = 10         [2.8, 2.8, 2.8, 3.2, 3.6]
n = 100        [3.2, 3.04, 3.16, 3.08, 3.36]
n = 1,000      [3.088, 3.124, 3.104, 3.216, 3.124]
n = 10,000     [3.146, 3.13, 3.1216, 3.1676, 3.1352]
n = 100,000    [3.15112, 3.14488, 3.13504, 3.13316, 3.14608]
n = 1,000,000  [3.140944, 3.141888, 3.14134, 3.142716, 3.14186]
n = 10,000,000 [3.1409232, 3.1418236, 3.1413228, 3.1417072, 3.14382]

  _     ._   __/__   _ _  _  _ _/_   Recorded: 19:08:07  Samples:  134
 /_//_/// /_\ / //_// / //_'/ //     Duration: 13.466    CPU time: 13.465
/   _/                      v4.5.0

Program: profile_pyinstrument.py

13.400 <module>  profile_pyinstrument.py:1
└─ 13.400 estimate_pi  profile_pyinstrument.py:6
   ├─ 12.700 <genexpr>  profile_pyinstrument.py:7
   │  ├─ 8.800 point  profile_pyinstrument.py:14
   │  │  ├─ 5.300 Random.uniform  random.py:546
   │  │  │     [4 frames hidden]  random, <built-in>
   │  │  │        3.900 [self]  None
   │  │  └─ 3.500 [self]  None
   │  ├─ 2.300 [self]  None
   │  └─ 1.600 hits  profile_pyinstrument.py:10
   │     ├─ 1.000 [self]  None
   │     └─ 0.600 abs  None
   │           [2 frames hidden]  <built-in>
   └─ 0.700 [self]  None
```

We can also use `profiler.open_in_browser()` to see all hidden stack frames.

![image.png](Code%20profiling%201b0746ff23cf80ff9226f1e9224eb8e0/image.png)

The report indicates that `estimate_pi()` spends most of its time in the generator expression, with the `point()` function identified as the bottleneck. While it initially seems this function can't be optimized since it relies on `random.uniform()`, closer inspection reveals an opportunity.

Examining the documentation or implementation of `random.uniform()` shows it's a pure-Python function, which can be significantly slower than C-implemented built-in functions. For the specific case of `uniform(0, 1)`, you can substitute the mathematically equivalent `random()` function, yielding a remarkable 40 percent performance improvement.