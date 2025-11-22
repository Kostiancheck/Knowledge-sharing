const std = @import("std");
const expect = @import("std").testing.expect;

test "defer" {
    var x: i16 = 5;
    {
        defer x += 2;
        try expect(x == 5);
    }
    try expect(x == 7);
}

fn createDynamicArray(count: usize) ![]u8 {
    const allocator = std.heap.page_allocator;
    const my_array = try allocator.alloc(u8, count);
    // Note: We return this, so the caller is responsible for the 'defer free'
    // defer allocator.free(my_array); // If this were here, it would free too early!
    std.debug.print("Array of size {d} allocated dynamically.\n", .{my_array.len});
    return my_array;
}

pub fn main() !void {
    var dynamic_array = try createDynamicArray(10);
    defer std.heap.page_allocator.free(dynamic_array); // Caller cleans up!

    for (0..dynamic_array.len) |i| {
        dynamic_array[i] = @intCast(i);
    }
    std.debug.print("Dynamic array elements: {d}\n", .{dynamic_array});
}
