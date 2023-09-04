**Cellular automata** is basically a set of simple agents (cells), where each agent has his own state and a subset of neighbors.

So, at each point in time (usually referred to as “generation”) there is a state of the system (set of states of cells).

One dimensional cellular automata is called Cellular Automaton.

We will store each generation of cellular automaton as a bit array. It turns out arrays are almost as memory efficient as vectors, but they are easier to deal with when it comes to multi-dimensional arrays. While it’s not our concern right now, we are planning to support multi-dimensional CAs in the future.

The most interesting rules: 

- 30: Random number generator
- 82: Sierpinski triangle

Links:

- [**https://mathworld.wolfram.com/ElementaryCellularAutomaton.html**](https://mathworld.wolfram.com/ElementaryCellularAutomaton.html)
- [**https://www.youtube.com/watchhttps://www.youtube.com/watch?v=DKGodqDs9sA](https://www.youtube.com/watch?v=DKGodqDs9sA) (note there is also part 7.2 and 7.3)**
- https://plato.stanford.edu/entries/cellular-automata/
- https://reference.wolfram.com/language/ref/CellularAutomaton.html
- https://crates.io/crates/bitvec - bit array (one bool per bit) in Rust
- https://www.reddit.com/r/cellular_automata/