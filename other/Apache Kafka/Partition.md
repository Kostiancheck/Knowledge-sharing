[[Topic|Topics]] are **partitioned**, meaning a topic is spread over a number of "buckets" located on different Kafka brokers. This distributed placement of your data is very important for scalability because it allows client applications to both read and write the data from/to many brokers at the same time. When a new event is published to a topic, it is actually appended to one of the topic's partitions. Events with the same event key (e.g., a customer or vehicle ID) are written to the same partition, and Kafka [guarantees](https://kafka.apache.org/documentation/#semantics) that any consumer of a given topic-partition will always read that partition's events in exactly the same order as they were written. So Kafka guaranties the order, but only within a partition.
- partitions spread across Brokers
- each Broker handles many Partitions
- each partition stored on Broker's disk
![[Pasted image 20231020194906.png]]

To make your data fault-tolerant and highly-available, every topic can be [[Replicas|replicated]].

