#spark #hadoop 
To understand wide and narrow transformations we firstly need to be aware of parent and child RDDs:
- Parent RDDs: Parent RDDs are the RDDs from which a new RDD is derived through transformations. In other words, the parent RDDs are the RDDs on which transformations are performed to generate a new RDD. An RDD can have one or more parent RDDs. For example, if you perform a map operation on an RDD, the original RDD becomes the parent RDD of the resulting RDD.
    
- Child RDDs: Child RDDs are the RDDs that are created as a result of applying transformations on parent RDDs. They represent the output RDDs of the transformations, but they are not actual output, just a script of transformations you need to apply to parent to get a child (lazy evaluation, all stuff). Each child RDD has one or more parent RDDs, depending on the transformations applied. Child RDDs maintain a reference to their parent RDD(s), allowing Spark to trace the lineage and recreate the RDDs if needed.


The parent-child relationship between RDDs is important because it enables fault tolerance and data lineage in Spark. Spark maintains the lineage information, which consists of the sequence of transformations applied to the RDDs, allowing it to recover lost or corrupted data by recomputing the affected RDDs from their parent RDDs.

Narrow dependencies or narrow transformations are categorized by the following traits:
- Operations can be collapsed into a single stage; for instance, a map() and filter() operation against elements in the same dataset can be processed in a single pass of each element in the dataset.
- Only one child RDD depends on the parent RDD; for instance, an RDD is created from a text file (the parent RDD), with one child RDD to perform the set of transformations in one stage.
- No shuffling of data between nodes is required.
**So you can execute narrow transformation on the any subset of data without information about other data**.Narrow operations are preferred because they maximize parallel execution and minimize shuffling, which can be a bottleneck and is quite expensive. 

Wide dependencies or wide transformations, in contrast, have the following traits:
- Operations define a new stage and often require a shuffle operation.
- RDDs have multiple dependencies; for instance, join() requires an RDD to be dependent upon two or more parent RDDs.
**In case of  wide transformations all rows with the same partitioning key value must be processed by the same worker node (in the case of partitioning)**
Data loss during wide transformation is costly, because in that case you need to recalculate re-create parent RDD and as a result recalculate all child RDDs (in worst case scenario)

![[Wide and narrow transformations.png]]

### Sources
1. [[Shuffling]]
2. [[Application, Job, Stage and Task]]
3. https://nag-9-s.gitbook.io/spark-notes/resilient-distributed-dataset-rdd/rdd-lineage
4. High Performance Spark - book, chapter 2 and 5