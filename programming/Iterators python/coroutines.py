def foo():
    """
    notice we use yield in both the 
    traditional generator sense and
    also in the coroutine sense.
    """
    msg = yield  # coroutine feature
    msg = f"HELLO WOLRD {msg}"
    yield msg    # generator feature

coro = foo()

# because a coroutine is a generator
# we need to advance the returned generator
# to the first yield within the generator function
next(coro)

# the .send() syntax is specific to a coroutine
# this sends "bar" to the first yield 
# so the msg variable will be assigned that value
result = coro.send("bar")

# because our coroutine also yields the msg variable
# it means we can print that value
print(result)  # bar


################ HOW TO RETURN IN FIRST NEXT ##################
print("".join(["=" for i in range(50)]))
def foo2():
    msg = yield "beep"
    yield msg

coro = foo2()

print(next(coro))  # beep

result = coro.send("bar2")

print(result)  # bar