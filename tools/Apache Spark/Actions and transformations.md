
Loading an RDD or performing a transformation on one does not trigger any data processing; it merely creates a plan for performing a computation. The computation is only triggered when an action (like foreach()) is performed on an RDD.

There are two types of RDD operations, _transformations_ and _actions_. _Transformations_ (e.g., `filter`, `map`, `union)` are operations that produce a new RDD by performing some useful data manipulation on another RDD. The other type of RDD operations, _actions_ (e.g., `count` or `saveAsTextFile`), trigger a computation in order to return a result to the calling program or write it to a stable storage.

It is important to understand that _transformations_ are evaluated lazily, meaning that computation does not take place until you invoke an _action_. Once an _action_ is triggered on an RDD, Spark examines RDD’s _lineage_ and uses that information to build a “graph of operations” that needs to be executed in order to compute the _action_. You can think of _transformations_ as a sort of diagram that tells Spark which operations need to happen and in which order once an _action_ gets executed. This “graph of operations” is called _Directed Acyclic Graph_ ([[DAG]]), after a special form of graph data structure that bears the same name. 

### Sources
1. . https://freecontent.manning.com/spark-in-action-the-notion-of-resilient-distributed-dataset-rdd/ - part from Spark in Action book
2. [[Hadoop The Definitive Guide, 4th Edition.pdf]] chapter 19
3. https://spark.apache.org/docs/3.4.0/rdd-programming-guide.html#resilient-distributed-datasets-rdds Spark documentation
