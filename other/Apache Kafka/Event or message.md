An **event/message** records the fact that "something happened" in the world or in your business. It is also called record or message in the documentation. When you read or write data to Kafka, you do this in the form of events. Conceptually, an event has a key, value, timestamp, and optional metadata headers. Here's an example event:

- Event key: "Alice"
- Event value: "Made a payment of $200 to Bob"
- Event timestamp: "Jun. 25, 2020 at 2:06 p.m."

The structure of message in Kafka is:
![[Pasted image 20231020223119.png]]
The main part here is that Kafka messages are key-value pairs. Key can be whatever you want (string, number, structure), if it's not provided it's set to null and will be sent in a [Round Robin](https://www.geeksforgeeks.org/round-robin-scheduling-with-different-arrival-times/) fashion to make it very simple. So that means that your first message is going to be sent to partition 0, and then your second message to partition 1 and then partition 2, and so on.

**But in case you send a key with your message, all** the messages that share the same key will always go to the same partition. So this is a very very important property of Kafka because that means if you need ordering for a specific field, for example, if you have cars and you want to get all the GPS positions in order for that particular car then you need to make sure to have your message key set as the unique identifier for your car i.e **carID** and so in our car GPS example that we have discussed in this article, **Topics, Partitions, and Offsets in Apache Kafka,** we need to choose the message key to be equal to **carID** so that we have all the car positions for that one specific car in order as part of the same partition.
Other parts of the message:
- compresion type:
  obvious
- headers: 
  key-value pairs with some metadata
- partition+offset
  Once a message is sent into a Kafka Topic then it will receive a partition number and an offset id. So Producer responsible for partition number but nor for the offset 
- timestamp
  Can be added either by the user (in producer app) or by the system (current time) and then that message will be sent to Kafka

Sources:
1.  https://kafka.apache.org/intro
2. https://www.youtube.com/watch?v=B5j3uNBH8X4&list=PLa7VYi0yPIH2PelhRHoFR5iQgflg-y6JA&index=3&ab_channel=Confluent