### Notes

Sources:

- https://www.scylladb.com/glossary/cap-theorem/
- https://www.scylladb.com/glossary/eventual-consistency/
- https://youtu.be/BHqjEjzAicA
- https://www.youtube.com/watch?v=KmGy3sU6Xw8

“*Cheap, Fast, and Good: Pick Two”*

![smth.png](https://s3-us-west-2.amazonaws.com/secure.notion-static.com/7c10c821-31e9-4cd1-88c5-218bbddc79b8/smth.png)

CAP Theorem is a concept that a distributed database system can only have 2 of the 3: Consistency, Availability and
Partition Tolerance.

![Untitled](https://s3-us-west-2.amazonaws.com/secure.notion-static.com/a00e3857-5f21-4511-9d1e-2a23596179df/Untitled.png)

![ap.drawio.png](https://s3-us-west-2.amazonaws.com/secure.notion-static.com/07d17a82-458c-4c5a-8200-9a5cb0205839/ap.drawio.png)

![cp.drawio.png](https://s3-us-west-2.amazonaws.com/secure.notion-static.com/0874706f-8846-4d27-9983-d682443e7bce/cp.drawio.png)

Need to say:

- Eventual consistency (ScyllaDB, Cassandra )
- Database systems such as RDBMS that are designed in part based on traditional ACID guarantees choose consistency over
  availability. In contrast, systems common in the NoSQL movement designed around the BASE philosophy select
  availability over consistency.
- PACELC

CP - MongoDB, Redis, makes outaged cluster unavailable before it fixed

AP - Cassandra, CouchDB, ScyllaDB

---

PACELC

![Untitled](https://s3-us-west-2.amazonaws.com/secure.notion-static.com/abd8e4b2-c43e-490e-8eb5-2238e94b1068/Untitled.png)