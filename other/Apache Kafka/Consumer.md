- consumers pull messages from topic. They go and ask kafka to subscribe for the topic and after that send the last offset that was red and ask kafka for messages after it
- consumer has offset of the last red message. This offset also stores in kafka cluster in the special topic

![[Pasted image 20231020230352.png]]

![[Pasted image 20231021220758.png]]

![[Pasted image 20231021220923.png]]
# Sources
1. https://kafka.apache.org/documentation/#theconsumer
2. https://www.youtube.com/watch?v=B5j3uNBH8X4&list=PLa7VYi0yPIH2PelhRHoFR5iQgflg-y6JA&index=3&ab_channel=Confluent