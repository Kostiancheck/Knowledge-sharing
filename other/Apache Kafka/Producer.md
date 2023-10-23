- Producers write data as messages to cluster
- Partitioner take hash from the message key to determine the partition to write to
- You can set-up if producer should wait for response (acknowledgment) from the broker ([[Message  Guarantees]])
![[Pasted image 20231021204018.png]]
# Sources
1. https://kafka.apache.org/documentation/#theproducer
2. https://www.youtube.com/watch?v=jY02MB-sz8I&list=PLa7VYi0yPIH2PelhRHoFR5iQgflg-y6JA&index=5&ab_channel=Confluent
