# Producer guarantees
[[Producer]] can  wait for acknowledgment from the broker. There are 3 options here:
- don't wait for the answer. Disk can be on fire, but we don't care.  We just know that we sent the message
- wait just for a leader
- wait for all replicas
![[Pasted image 20231021204802.png]]

# Consumer guarantees
1. It can read the messages, then save its position in the log, and finally process the messages. In this case there is a possibility that the consumer process crashes after saving its position but before saving the output of its message processing. In this case the process that took over processing would start at the saved position even though a few messages prior to that position had not been processed. This corresponds to "at-most-once" semantics as in the case of a consumer failure messages may not be processed.
2. It can read the messages, process the messages, and finally save its position. In this case there is a possibility that the consumer process crashes after processing messages but before saving its position. In this case when the new process takes over the first few messages it receives will already have been processed. This corresponds to the "at-least-once" semantics in the case of consumer failure. In many cases messages have a primary key and so the updates are idempotent (receiving the same message twice just overwrites a record with another copy of itself).
# Delivery guarantees
Kafka provides various [guarantees](https://kafka.apache.org/documentation/#semantics) such as the ability to process events exactly-once.

![[Pasted image 20231021205530.png]]
- _At most once_—Messages may be lost but are never redelivered. 
  If can happens when producer don't wait for response (Acks 0)
- _At least once_—Messages are never lost but may be redelivered.
  If a producer failed to receive a response indicating that a message was committed, it had little choice but to resend the message. This provides at-least-once delivery semantics since the message may be written to the log again during resending if the original request had in fact succeeded
- _Exactly once_—this is what people actually want, each message is delivered once and only once.
  This is impossible due to the Atomic broadcast problem (kind of CAP theorem of streaming processing). BUT, Kafka did some work around that works good enough. In few words they don't guarantee exactly-one delivery from Producer, they just guarantee exactly once processing on the Consumer side. It works somehow similar to DB transactions. But you will need to make some changes on Consumer side

# Sources
1. https://www.youtube.com/watch?v=jY02MB-sz8I&list=PLa7VYi0yPIH2PelhRHoFR5iQgflg-y6JA&index=5&ab_channel=Confluent
2. 