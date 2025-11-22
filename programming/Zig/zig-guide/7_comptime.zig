const std = @import("std");

fn fibonacci(n: u16) u16 {
    var accumulator: f64 = 1.0;
    for (0..10000) |_| accumulator = std.math.sin(std.math.sqrt(accumulator * 1.000000000000001 + 0.0000000000000001));
    if (n == 0 or n == 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

pub fn main() !void {
    @setEvalBranchQuota(10000000);
    std.debug.print("time now {d}\n", .{std.time.milliTimestamp()});
    const x = comptime fibonacci(10);
    std.debug.print("fibonacci of 10: {any}\n", .{x});
    std.debug.print("time now {d}\n", .{std.time.milliTimestamp()});
    const y = fibonacci(10);
    std.debug.print("fibonacci of 10 (computed at runtime): {any}\n", .{y});
    std.debug.print("time now {d}\n", .{std.time.milliTimestamp()});
}
