 #spark #hadoop 

A Spark job is more general than a MapReduce job, though, since it is made up of an arbitrary directed acyclic graph (DAG) of stages, each of which is roughly equivalent to a map or reduce phase in MapReduce. Stages are split into tasks by the Spark runtime and are run in parallel on partitions of an RDD spread across the cluster — just like tasks in MapReduce. A job always runs in the context of an application (represented by a SparkContext instance) that serves to group RDDs and shared variables. An application can run more than one job, in series or in parallel, and provides the mechanism for a job to access an RDD that was cached by a previous job in the same application. An interactive Spark session, such as a spark-shell session, is just an instance of an application.

### Application
Even when there is no job running, spark application can have processes running on its behalf. It is a self-contained computation that runs user-supplied code to compute a result

### Job
It parallels computation consisting of multiple tasks. Visualization of the Job is [[DAG]], it means Job has some set of transformations and action as the last step (DAG leaf).

### Stage
Each job is divided into small sets of tasks which are known as stages. Every wide transformation in the Job add a Stage. It means that Stage = set of narrow transformations and an edge of the Stage is necessity to do wide transformation. 
Because Stage edges requires interaction with Driver, Stages that connected to the same Job probably must be calculated in series, not in parallel. 

### Task
It is a unit of work, which we sent to the executor. Every stage has some task, one task per partition. All Tasks of the Stage run the same code, but for the difference partitions/ One Task can't run on the multiple [[Driver and Executor|executors]]. Number or Task in Stage = number of sections or input RDD, but number of Tasks that runs in parallel cannot be bigger than number of machine cores (obviously)

![[Spark application tree.png]]

### Sources
1. [[Hadoop The Definitive Guide, 4th Edition.pdf]] chapter 19
2. High Performance Spark - book, chapter 2
3. [https://techvidvan.com/tutorials/spark-architecture/](https://techvidvan.com/tutorials/spark-architecture/) - nice article about Spark
