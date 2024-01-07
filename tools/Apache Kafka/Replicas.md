To make your data fault-tolerant and highly-available, every topic can be **replicated**, even across geo-regions or datacenters, so that there are always multiple brokers that have a copy of the data just in case things go wrong, you want to do maintenance on the brokers, and so on. A common production setting is a replication factor of 3, i.e., there will always be three copies of your data. This replication is performed at the level of topic-partitions.

Leader is the main partition, partition producers write in. It's possible to configure the consumer to read also from followers, but leader may have a few as-yet unreplicated messages at the end of its log, since replicas need some time to pull data from leader/to sync with leader. Followers works really similar to consumers.

If broker dies one of the followers elected as a leader.

The leader keeps track of the set of "in sync" replicas, which is known as the ISR. If a follower dies, then the controller will notice the failure through the loss of its session, and will remove the broker from the ISR. On the other hand, if the follower lags too far behind the leader but still has an active session, then the leader can also remove it from the ISR.

![[Pasted image 20231021202158.png]]
# Sources
1. https://kafka.apache.org/documentation/#replication
2. https://www.youtube.com/watch?v=jY02MB-sz8I&list=PLa7VYi0yPIH2PelhRHoFR5iQgflg-y6JA&index=5&ab_channel=Confluent