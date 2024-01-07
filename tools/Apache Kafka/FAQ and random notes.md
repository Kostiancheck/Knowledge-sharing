1. When should you switch to streaming, what practical problem does it solve? 
   A lot of systems are event-driven. Our world is event driven. The difference is how you send events.
   You can send or consume events in batches, but if you want to reduce the latency (e.g. for fraud detection, or system monitoring) you need streaming solution. And if you think about it, streaming concept sounds really natural, because you simply assume, that your data will never end. So it is just a continuous flow of data. Also our world works like an event-driven system: you have some events -> you react to them. 
   Also streaming can reduce data loses, because you send events immediately, so you don't need to care about storage. [^1]
2. Why do Kafka needs Permanent Storage
   In case of multiple consumers, when you want to fill-backward, re-consume data, etc. If you don't need storage you can use some kind of queues like SQS that deletes message after it was consumed.
3. Why TCP but not HTTP
   There are a number of reasons
   -  client implementors can make use of some of the more advanced TCP features-the ability to multiplex requests, the ability to simultaneously poll many connections, etc.
   - We have also found HTTP libraries in many languages to be surprisingly shabby. 
   - HTTP headers can be overhead when there are a lot of messages
   - it could be harder to parse http due to the text-based nature[^2][^3]
4. Why consumer pull data from broker, but not vise verse - broker push data to consumer?
   - in a push-based system consumer tends to be overwhelmed when its rate of consumption falls below the rate of production 
   - push-based system must choose to either send a request immediately or accumulate more data and then send it later without knowledge of whether the downstream consumer will be able to immediately process it. If tuned for low latency, this will result in sending a single message at a time only for the transfer to end up being buffered anyway, which is wasteful
   - BUT in a  pull-based system if the broker has no data the consumer may end up polling in a tight loop, effectively busy-waiting for data to arrive. To avoid this we have parameters in our pull request that allow the consumer request to block in a "long poll" waiting until data arrives (and optionally waiting until a given number of bytes is available to ensure large transfer sizes).[^4]
5. Kak Kafkat'?

Notes:
1. I think it's good business template: when you create some tool, make it open source and after that creates some platform around that tool. So people have nice open-source tool, and you are getting money and can support and contribute to that tool. Examples: Confluent and Kafka, Spark and Databricks, etc.


[^1]: https://www.upsolver.com/blog/apache-kafka-use-cases-when-to-use-not
[^2]: https://kafka.apache.org/protocol.html#protocol_philosophy
[^3]: https://stackoverflow.com/questions/35527025/why-does-kafka-not-use-http
[^4]: https://kafka.apache.org/documentation/#theconsumer