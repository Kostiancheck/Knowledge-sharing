import dis
import re

def find(to_find: str, text: str) -> re.Match:
    # return re.search(rf"({to_find})", text)
    compiled = re.compile(rf"({to_find})")
    return compiled.search(text)

if __name__=="__main__":
    print(dis.dis(find))

    # LOAD_FAST -> Pushes a reference to the local variable onto the stack.
    # STORE_FAST -> Stores STACK.pop() into the local variable