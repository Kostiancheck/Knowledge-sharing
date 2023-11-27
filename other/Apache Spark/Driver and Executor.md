#spark #hadoop 

At the highest level, there are two independent entities: the driver, which hosts the application (`SparkContext`) and schedules tasks for a job; and the executors, which are exclusive to the application, run for the duration of the application, and execute the application’s tasks. Usually the driver runs as a client that is not managed by the cluster manager and the executors run on machines in the cluster, but this isn’t always the case.

Driver:
- **master node** of a spark application
- runs the main function of an application
- driver translates user code into a specified job
- schedules the job execution and negotiates with the cluster manager
- stores the metadata about all RDDs as well as their partitions
- creates tasks by converting applications into small execution units

Executors:
- agents those are responsible for the execution of tasks
- performs all the data processing
- write and read data from/to external sources
- can store computation results in-memory or on disk
- users can also select for dynamic allocations of executors


![[Spark Cluster.png]]
To run on a cluster, the SparkContext can connect to several types of _cluster managers_ (either Spark’s own standalone cluster manager, Mesos, YARN or Kubernetes), which allocate resources across applications. Once connected, Spark acquires _executors_ on nodes in the cluster, which are processes that run computations and store data for your application. Next, it sends your application code (defined by JAR or Python files passed to SparkContext) to the executors. Finally, SparkContext sends tasks to the executors to run.

There are several useful things to note about this architecture:
1. Each application gets its own executor processes, which stay up for the duration of the whole application and run tasks in multiple threads. This has the benefit of isolating applications from each other, on both the scheduling side (each driver schedules its own tasks) and executor side (tasks from different applications run in different JVMs). However, it also means that data cannot be shared across different Spark applications (instances of SparkContext) without writing it to an external storage system.
2. Spark is agnostic to the underlying cluster manager. As long as it can acquire executor processes, and these communicate with each other, it is relatively easy to run it even on a cluster manager that also supports other applications (e.g. Mesos/YARN/Kubernetes).
3. Because the driver schedules tasks on the cluster, it should be run close to the worker nodes, preferably on the same local area network. If you’d like to send requests to the cluster remotely, it’s better to open an RPC (Remote procedure call) to the driver and have it submit operations from nearby than to run a driver far away from the worker nodes.

More complex diagram of Spark architecture:
![[Spark Architecture.png]]

# Apache Spark: The number of cores vs. the number of executors
To hopefully make all of this a little more concrete, here’s a worked example of configuring a Spark app to use as much of the cluster as possible: Imagine a cluster with six nodes running NodeManagers, each equipped with 16 cores and 64GB of memory. The NodeManager capacities, yarn.nodemanager.resource.memory-mb and yarn.nodemanager.resource.cpu-vcores, should probably be set to 63 * 1024 = 64512 (megabytes) and 15 respectively. We avoid allocating 100% of the resources to YARN containers because the node needs some resources to run the OS and Hadoop daemons. In this case, we leave a gigabyte and a core for these system processes. Cloudera Manager helps by accounting for these and configuring these YARN properties automatically.

The likely first impulse would be to use --num-executors 6 --executor-cores 15 --executor-memory 63G. However, this is the wrong approach because:

63GB + the executor memory overhead won’t fit within the 63GB capacity of the NodeManagers. The application master will take up a core on one of the nodes, meaning that there won’t be room for a 15-core executor on that node. 15 cores per executor can lead to bad HDFS I/O throughput.

A better option would be to use --num-executors 17 --executor-cores 5 --executor-memory 19G. Why?

This config results in three executors on all nodes except for the one with the AM, which will have two executors. --executor-memory was derived as (63/3 executors per node) = 21. 21 * 0.07 = 1.47. 21 – 1.47 ~ 19.

### Sources
1. https://spark.apache.org/docs/latest/cluster-overview.html - spark doc about Cluster mode
2. [[Hadoop The Definitive Guide, 4th Edition.pdf]] chapter 19
3. [[Application, Job, Stage and Task]]
4. https://techvidvan.com/tutorials/spark-architecture/ - nice article about Spark
5. https://stackoverflow.com/questions/24622108/apache-spark-the-number-of-cores-vs-the-number-of-executors