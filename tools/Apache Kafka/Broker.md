![[Pasted image 20231020224951.png]]
Brokers are part of Kafka Cluster and the main computation power. There are some machines/VMs/Servers/nodes/containers with disk storage.
- brokers store messages on disk
- brokers manage partitions and handle write and read requests
- manage replication and partitions
- cluster can have many brokers
- each broker manages multiple partitions

Brokers are intentionally easy designed for scalability and easy manegment (run broker if previous failed, etc) 