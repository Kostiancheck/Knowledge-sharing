When running Python program, CPython compiles it into bytecode. Then, virtual machine (interpreter) reads bytecode command by command and executes it.

>all the VM has to do is to iterate over the instructions and to act according to them. And this is what essentially `_PyEval_EvalFrameDefault()` does. It contains an infinite `for (;;)` loop that we refer to as the evaluation loop. Inside that loop there is a giant `switch` statement over all possible opcodes. Each opcode has a corresponding `case` block containing the code for executing that opcode.

So, compared to executing machine code, Python's interpreter adds an overhead of executing a switch statement to figure out which instruction to actually run.

## Links
1. Introduction to Python bytecode: https://opensource.com/article/18/4/introduction-python-bytecode
2. How Python bytecode is executed: https://tenthousandmeters.com/blog/python-behind-the-scenes-4-how-python-bytecode-is-executed/
3. dis codes: https://docs.python.org/3/library/dis.html