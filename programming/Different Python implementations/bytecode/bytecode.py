import dis

def hello_world() -> str:
    print("Hello, World!")

if __name__=="__main__":
    dis.dis(hello_world)

    # print(dis.dis("{}"))
    # print("-")
    # print(dis.dis("dict()"))

    # LOAD_GLOBAL -> look up the global object referenced by the name at index X of co_names (which is the print function) and push it onto the evaluation stack
    # LOAD_CONST -> push const to "evaluation stack"
    # PRECALL -> "small advantage for specialization" - REMOVED in 3.12
    # CALL -> Calls a callable
    # POP_TOP -> pop top of stack item
