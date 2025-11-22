const py = @import("pydust");

const root = @This();

pub fn hello() !py.PyString {
    return try py.PyString.create("Hello!");
}

comptime {
    py.rootmodule(root);
}
