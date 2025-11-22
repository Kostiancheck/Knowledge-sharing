Zig is a lower-level language, similar to C/C++ or Rust.
Killer feature: you can use Zig as a zero-dependency, drop-in C/C++ compiler that supports cross-compilation out-of-the-box.

How is it possible? Zig includes Clang, whish does not add much overhead since they both rely on LLVM anyway.

Cool testing syntax
``` zig
const std = @import("std"); 

test "expect addOne adds one to 41" { 
	// The Standard Library contains useful functions to help create tests. 
	// `expect` is a function that verifies its argument is true. 
	// It will return an error if its argument is false to indicate a failure. 
	// `try` is used to return an error to the test runner to notify it that the test failed. 
	try std.testing.expect(addOne(41) == 42); 
}
```
and then
``` shell
$ zig test testing_introduction.zig 
1/2 testing_introduction.test.expect addOne adds one to 41...OK 
2/2 testing_introduction.decltest.addOne...OK 
All 2 tests passed.
```

Defer: do something when exiting current block
``` zig
const expect = @import("std").testing.expect;

test "defer" {
    var x: i16 = 5;
    {
        defer x += 2;
        try expect(x == 5);
    }
    try expect(x == 7);
}
```

Files as modules - just like Python!

Compiler is important. Debug builds catch overflow, use-after-free, and other mistakes. Release builds remove those checks for maximum performance.

To use it on Windows, I just downloaded the binary and added path to Path env variable.

# Sources
1. https://ziglang.org/
2. Why  Zig is so cool? https://nilostolte.github.io/tech/articles/ZigCool.html
	1. HN discussion https://news.ycombinator.com/item?id=45852328
3. https://zig.guide/
4. https://www.zigbook.net/
5. LLVM https://en.wikipedia.org/wiki/LLVM