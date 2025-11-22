const std = @import("std");

test "out of bounds" {
    @setRuntimeSafety(false);
    const a = [3]u8{ 1, 2, 3 };
    var index: u8 = 5;
    const b = a[index];
    std.debug.print("Array of size {d} allocated dynamically.\n", .{b});

    // _ = b;
    index = index;
}
