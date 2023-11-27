Spark DataFrames — built on top of Spark SQL — get their performance speeds using an underlying catalyst optimizer. Catalyst optimizer finds the most efficient ways to apply your transformations and actions. Catalyst optimizer is the reason why the DataFrames have better performance than RDDs (Spark’s native API). 

Whenever we run a query using Spark SQL (it can be DataFrame code in PySpark as well), it undergoes several planning stages before converting into a physical plan and getting executed. Using Dataframes and Spark SQL means that you rely on a catalyst optimizer to optimize your query plan instead of using RDDs and doing it yourself.

Catalyst is based on functional programming constructs in Scala and designed with these key two purposes:
- Easily add new optimization techniques and features to Spark SQL
- Enable external developers to extend the optimizer (e.g. adding data source specific rules, support for new data types, etc.)

For example, (i) It checks for all the tasks which can be performed and computed together in one Stage. (ii) In a multi-join query, it decides the order of execution of query for better performance. (iii) Tries to optimize the query by evaluating the filter clause before any project. Tries to optimize the query to run multiple transformations during one pass through the data.


![[Spark app plan.png]] ^1f7a20

### Sources
1. https://www.systemsltd.com/blogs/apache-spark-architecture-and-application-lifecycle
2. https://www.databricks.com/glossary/catalyst-optimizer - databricks article
3. https://blog.knoldus.com/understanding-sparks-logical-and-physical-plan-in-laymans-term/