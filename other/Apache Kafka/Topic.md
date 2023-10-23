Topics are streams of related [[Event or message|events]] in Kafka. Each topic has a name that is unique across the entire Kafka cluster. Messages are sent to and read from specific topics. In other words, producers write data to topics, and consumers read data from topics.

Topics in Kafka are always multi-producer and multi-subscriber: a topic can have zero, one, or many producers that write events to it, as well as zero, one, or many consumers that subscribe to these events. Events in a topic can be read as often as needed—unlike traditional messaging systems, events are not deleted after consumption. Instead, you define for how long Kafka should retain your events through a per-topic configuration setting, after which old events will be discarded. Kafka's performance is effectively constant with respect to data size, so storing data for a long time is perfectly fine.

Topics are [[Partition|partitioned]], meaning a topic is spread over a number of "buckets" located on different Kafka brokers.

Messages in topics are immutable, you cannot change them, you can only delete them, or send new message with fixed info.

![[Pasted image 20231020194331.png|700]]

![[Pasted image 20231020200152.png]]

# Compacted topics
![[Pasted image 20231021222541.png]]
You can set-up the topic to do "compaction". It means that Kafka will periodically scan the log and retains the most recent message for each key and removes all older versions.

# Sources
1. https://www.youtube.com/watch?v=B5j3uNBH8X4&list=PLa7VYi0yPIH2PelhRHoFR5iQgflg-y6JA&index=3&ab_channel=Confluent
2. https://kafka.apache.org/intro
3. https://dattell.com/data-architecture-blog/what-is-a-kafka-topic/
4. https://www.conduktor.io/blog/understanding-kafkas-internal-storage-and-log-retention/
5. https://levelup.gitconnected.com/compaction-of-topic-data-in-kafka-95a57f2aa6c9