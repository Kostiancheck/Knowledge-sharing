#spark #hadoop 

![[Spark app plan.png]]

1. ***Unresolved Logical Plan***
   Checks if code is valid and syntax is correct
2. ***Logical Plan***
   Using **Catalog** - repository where all the information about Spark table, DataFrame, DataSet will be present - and **Analyzer** - helps us to resolve/verify the semantics, column name, table name by cross-checking with the Catalog - checks if all columns and tables we query exist, all methods are applicable (e.g. correct data types), etc.
3. ***Optimized Logical Plan***
   Optimizes Logical (aka. Resolved Logical) Plan using [[Catalyst optimizer]]
1. ***Physical Plan***
   It simply specifies how our Logical Plan is going to be executed on the cluster. It generates different kinds of execution strategies and then keeps comparing them in the ***Cost Model***
5. ***Cost Model***
   Comparing execution strategies.
6. ***Selected Physical Plan***
   Finally, whichever plan/strategy is going to be the best optimal one is selected as the  “Selected Physical Plan”.
7. ***Final RDDs***
   Once the Best Physical Plan is selected, it’s the time to generate the executable code (DAG of RDDs) for the query that is to be executed in a cluster in a distributed fashion. This process is called **Codegen** and that’s the job of Spark’s **Tungsten** Execution Engine.

For more details about each Plan check out [4]. You can find how to read Plans in [5].

You can check all these plans for your query using [`.explain(mode)`](https://spark.apache.org/docs/latest/api/scala/org/apache/spark/sql/Dataset.html#explain(mode:String):Unit) method of the `Dataset`

### Sources
1. [[Catalyst optimizer]]
2. High Performance Spark - book, chapter 3
3. https://blog.knoldus.com/understanding-sparks-logical-and-physical-plan-in-laymans-term/ - blogpost about Physical and Logical plans
4. https://www.clairvoyant.ai/blog/apache-spark-logical-and-physical-plans - blog post with Plans comparison by examples
5. https://www.youtube.com/watch?v=UZt_tqx4sII&ab_channel=RocktheJVM - Rock the JVM video about how to read Spark Plans