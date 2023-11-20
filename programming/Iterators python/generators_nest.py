# def baz():
#     for i in range(10):
#         yield i

# def bar():
#     for i in range(5):
#         yield i

# def foo():
#     for v in bar():
#         yield v
#     for v in baz():
#         yield v

# for v in foo():
#     print(v)





def baz():
    for i in range(10):
        yield i

def bar():
    for i in range(5):
        yield i

def foo():
    yield from bar()
    yield from baz()

for v in foo():
    print(v)