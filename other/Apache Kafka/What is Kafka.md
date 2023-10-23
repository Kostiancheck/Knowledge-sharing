Apache Kafka is an open-source distributed streaming system used for stream processing, real-time data pipelines, and data integration at scale. Originally created to handle real-time data feeds at LinkedIn in 2011, Kafka quickly evolved from messaging queue to a full-fledged event streaming platform. Apache Kafka consists of a storage layer and a compute layer that combines efficient, real-time data ingestion, streaming data pipelines, and storage across distributed systems.
Some main features:
- ==High Throughput==
  Capable of handling high-velocity and high-volume data, Kafka can handle millions of messages per second.
- ==High Scalability==
  Scale Kafka clusters up to a thousand brokers, trillions of messages per day, petabytes of data, hundreds of thousands of partitions. Elastically expand and contract storage and processing.
- ==Low Latency==
  Can deliver these high volume of messages using a cluster of machines with latencies as low as 2ms
- ==Permanent Storage==
  Safely, securely store streams of data in a distributed, durable, reliable, fault-tolerant cluster
- ==High Availability & Fault Tolerance==
  Extend clusters efficiently over availability zones or connect clusters across geographic regions, making Kafka highly available. Cluster nature and data replication makes it fault tolerant with no risk of data loss (I wouldn't say NO data loss, just very unlikely data loss).
[^1]

Kafka is a distributed system consisting of **servers** and **clients** that communicate via a high-performance [TCP network protocol](https://kafka.apache.org/protocol.html) [^2]

[^1]: https://www.confluent.io/what-is-apache-kafka/
[^2]: https://kafka.apache.org/intro