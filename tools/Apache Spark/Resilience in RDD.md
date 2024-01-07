#spark #hadoop 

### Resilience
The central abstraction in the Spark is RDD - Resilient Distributed Dataset. It's immutable fault-tolerant collection of objects that partitioned across multiple machines in a cluster. The term “resilient” in “Resilient Distributed Dataset” refers to the fact that Spark can automatically reconstruct a lost partition by recomputing it from the RDDs that it was computed from.  In case of failure, the RDDs track data’s lineage and regenerate the lost data. This process is automatic, and RDDs use the stored transformations to rebuild the dataset.
While other distributed computation frameworks facilitate fault-tolerance by replicating data to multiple machines (so it can be restored from healthy replicas once a node fails), RDDs are different, they provide fault tolerance by logging the transformations used to build a dataset (how it came to be) rather than the dataset itself. If a node fails, only a subset of the dataset that resided on the failed node needs to be recomputed.

Spark achieves fault tolerance using the [[DAG]] by using a technique called lineage, which is the record of the transformations that were used to create an RDD. When a partition of an RDD is lost due to a node failure, Spark can use the lineage to rebuild the lost partition.

The lineage is built up as the DAG is constructed, and Spark uses it to recover from any failures during the job execution. When a node fails, the RDD partitions that were stored on that node are lost, and Spark uses the lineage to recompute the lost partitions. Spark rebuilds the lost partitions by re-executing the transformations that were used to create the RDD.

To achieve fault tolerance, Spark uses two mechanisms:

1. ==`RDD Persistence`==: When an RDD is marked as “persistent,” Spark will keep its partition data in memory or on disk, depending on the storage level used. This ensures that if a node fails, Spark can rebuild the lost partitions from the persisted data, rather than recomputing the entire RDD.
2. ==`Checkpointing`==: Checkpointing is a mechanism to periodically save the RDDs to a stable storage like HDFS. This mechanism reduces the amount of recomputation required in case of failures. In case of a node failure, the RDDs can be reconstructed from the latest checkpoint and their lineage.

### Sources
1. [[Hadoop The Definitive Guide, 4th Edition.pdf]] chapter 19
2. https://spark.apache.org/docs/3.4.0/rdd-programming-guide.html#resilient-distributed-datasets-rdds Spark documentation
3. https://freecontent.manning.com/spark-in-action-the-notion-of-resilient-distributed-dataset-rdd/ - part from Spark in Action book
4. https://sparkbyexamples.com/spark/what-is-dag-in-spark/?expand_article=1 - sparkByExamples article about DAG