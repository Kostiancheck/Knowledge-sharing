Just-in-time (JIT) compilation is compiling at run time, instead of compiling ahead (before running).

Notable examples:
- Java (JVM)
- Nodejs
- V8 (Javascipt and WebAssembly) https://v8.dev/
- Swift
- and now Python (PyPy, CPython)
- PHP 8

In some specific cases, JIT compilation can be very useful.

Let's say you are programming a word editor. It has a function to find and replace string matching certain regular expression. 

![[Pasted image 20240228180036.png]]

It would really help if you could compile this regular expression into more efficient representation, as you will re-use it thousands of times over the whole document. Unfortunately, you do not know what this regular expression will be **ahead of time**. You will only know it when user inputs it **at the runtime**. So, you might want to compile it at run time, just after user inputs it.

This is what just in time compilation is! 

