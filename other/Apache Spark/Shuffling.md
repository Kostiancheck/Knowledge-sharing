#spark #hadoop 

Certain operations within Spark trigger an event known as the shuffle. The shuffle is Spark’s mechanism for re-distributing/rearrange data so that it’s grouped differently across partitions. This typically involves copying data across executors and machines, making the shuffle a complex and costly operation.

All rows with the same partitioning key value must be processed by the same worker node (in the case of partitioning). By default, Spark shuffle operation uses partitioning of hash to determine which key-value pair shall be sent to which machine.


### Sources
1. [[Hadoop The Definitive Guide, 4th Edition.pdf]] chapter 19
2. https://nag-9-s.gitbook.io/spark-notes/resilient-distributed-dataset-rdd/rdd-lineage
3. https://www.mikulskibartosz.name/shuffling-in-apache-spark/
4. https://www.youtube.com/watch?v=ffHboqNoW_A&ab_channel=PalantirDevelopers - Palantir dev video about shuffling
