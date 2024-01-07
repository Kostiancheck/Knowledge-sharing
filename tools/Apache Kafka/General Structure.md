[[Producer|Producers]] are those client applications that publish (write) events to Kafka, and [[Consumer|consumers]] are those that subscribe to read and process these events. In Kafka, producers and consumers are fully decoupled and agnostic of each other, which is a key design element to achieve the high scalability that Kafka is known for. For example, producers never need to wait for consumers. 

[[Event or message|Events]] are organized and durably stored in [[Topic|topics]].

![[Pasted image 20231020230509.png]]