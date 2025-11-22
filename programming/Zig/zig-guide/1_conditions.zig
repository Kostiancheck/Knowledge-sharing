const expect = @import("std").testing.expect;

test "if statement" {
    const a = true;
    var x: u16 = 0;
    if (a) {
        x += 1;
    } else if (a == 4) {
        x = 4;
    } else {
        x += 2;
    }
    try expect(x == 1);
}
