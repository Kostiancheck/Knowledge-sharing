![[Pasted image 20231020195047.png]]
Partitions are further split into Segments which are the actual files on the file system. A log for a topic named "my-topic" with two partitions consists of two directories (namely `my-topic-0` and `my-topic-1`) populated with data files containing the messages for that topic. The format of the log files is a sequence of "log entries"; each log entry is a 4 byte integer _N_ storing the message length which is followed by the _N_ message bytes. Each message is uniquely identified by a 64-bit integer _offset_ giving the byte position of the start of this message in the stream of all messages ever sent to that topic on that partition. The on-disk format of each message is given below. Each log file is named with the offset of the first message it contains. So the first file created will be 00000000000000000000.log, and each additional file will have an integer name roughly _S_ bytes from the previous file where _S_ is the max log file size given in the configuration.

Kafka team was thinking about using general ID, but they decided that it gives no benefits and adding additional complexity for maintaining.

Here is a sample directory structure for Topic **my-topic** and its partition **my-topic-0**.
```
|── my-topic-0
   ├── 00000000000000000000.index
   ├── 00000000000000000000.log
   ├── 00000000000000000000.timeindex
   ├── 00000000000000001007.index
   ├── 00000000000000001007.log
   ├── 00000000000000001007.snapshot
   ├── 00000000000000001007.timeindex
   ├── leader-epoch-checkpoint
```

- **.log file** - This file contains the actual records and maintains the records up to a specific offset. The name of the file depicts the starting offset added to this file.
- **.index file** - This file has an index that maps a record offset to the byte offset of the record within the  **.log** file. This mapping is used to read the record from any specific offset.
- **.timeindex file -** This file contains the mapping of the timestamp to record offset, which internally maps to the byte offset of the record using the **.index** file. This helps in accessing the records from the specific timestamp.
- **.snapshot file** - contains a snapshot of the producer state regarding sequence IDs used to avoid duplicate records. It is used when, after a new leader is elected, the preferred one comes back and needs such a state to become a leader again. This is only available for the active segment (log file).
- **leader-epoch-checkpoint** - It refers to the number of leaders previously assigned by the controller. The replicas use the leader epoch as a means of verifying the current leader. The leader-epoch-checkpoint file contains two columns: epochs and offsets. Each row is a checkpoint for the latest recorded leader epoch and the leader's latest offset upon becoming leader
If you try to open and read these files, you will find that the content in these files is not readable.
From the structure, we could see that the first log segment **00000000000000000000.log** contains the records from offset 0 to offset 1006. The next segment **00000000000000001007.log** has the records starting from offset 1007, and this is called the active segment.

# Log file
As the name suggests, every message written to a segment is logged in its `.log` file. Let’s try to read the contents of a `.log` file. As I said above these files are not readable, so it's readable version of the files.
```
Starting offset: 0
baseOffset: 0 lastOffset: 6 count: 7 baseSequence: -1 lastSequence: -1 producerId: -1 producerEpoch: -1 partitionLeaderEpoch: 0 isTransactional: false isControl: false position: 0 CreateTime: 1586329540137 size: 173 magic: 2 compresscodec: NONE crc: 386807681 isvalid: true
| offset: 0 CreateTime: 1586329540133 keysize: 1 valuesize: 3 sequence: -1 headerKeys: [] key: 2 payload: BMW
| offset: 1 CreateTime: 1586329540135 keysize: 1 valuesize: 9 sequence: -1 headerKeys: [] key: 5 payload: Chevrolet
| offset: 2 CreateTime: 1586329540135 keysize: 1 valuesize: 7 sequence: -1 headerKeys: [] key: 6 payload: Porsche
| offset: 3 CreateTime: 1586329540136 keysize: 2 valuesize: 6 sequence: -1 headerKeys: [] key: 10 payload: Jaguar
| offset: 4 CreateTime: 1586329540136 keysize: 2 valuesize: 5 sequence: -1 headerKeys: [] key: 11 payload: Volvo
| offset: 5 CreateTime: 1586329540136 keysize: 2 valuesize: 10 sequence: -1 headerKeys: [] key: 12 payload: Land Rover
| offset: 6 CreateTime: 1586329540137 keysize: 2 valuesize: 12 sequence: -1 headerKeys: [] key: 15 payload: Aston Martin
.
.
.
baseOffset: 28 lastOffset: 34 count: 7 baseSequence: -1 lastSequence: -1 producerId: -1 producerEpoch: -1 partitionLeaderEpoch: 0 isTransactional: false isControl: false position: 692 CreateTime: 1586329575827 size: 173 magic: 2 compresscodec: NONE crc: 3347769538 isvalid: true
| offset: 28 CreateTime: 1586329575821 keysize: 1 valuesize: 3 sequence: -1 headerKeys: [] key: 2 payload: BMW
| offset: 29 CreateTime: 1586329575823 keysize: 1 valuesize: 9 sequence: -1 headerKeys: [] key: 5 payload: Chevrolet
| offset: 30 CreateTime: 1586329575823 keysize: 1 valuesize: 7 sequence: -1 headerKeys: [] key: 6 payload: Porsche
| offset: 31 CreateTime: 1586329575824 keysize: 2 valuesize: 6 sequence: -1 headerKeys: [] key: 10 payload: Jaguar
| offset: 32 CreateTime: 1586329575825 keysize: 2 valuesize: 5 sequence: -1 headerKeys: [] key: 11 payload: Volvo
| offset: 33 CreateTime: 1586329575825 keysize: 2 valuesize: 10 sequence: -1 headerKeys: [] key: 12 payload: Land Rover
| offset: 34 CreateTime: 1586329575827 keysize: 2 valuesize: 12 sequence: -1 headerKeys: [] key: 15 payload: Aston Martin

```
We can see the next information
- **baseOffset** : Offset of first message in the batch
- **lastOffset** : Offset of last message in the batch
- **count** : Number of messages in the batch
- **position** : Position of the batch in the file
- **CreatedTime** :Created time of last message in the batch
- **size** : Size of the batch(in bytes)
- **Messages** : List of messages(& its details) in the batch

# Index file

Before we start discussing about the `.index` file, lets take a small detour to understand the need for `.index` file. As we know, every consumer has an associated numeric offset for each of its partition(s). This offset indicates the offset of the last processed message of a partition. Since the consumers process messages continuously, **extracting a message given an offset** should be a very frequent operation. Lets say the consumer needs to find a message with offset **k** in a partiton. This should involve two steps
1. Find the appropriate segment for offset k.
2. Extract the message with offset k from this segment.

From our previous discussion on segments, we know that the file name’s suffix indicates the _base offset_(= offset of the first message) in that segment. Given this information, by doing a simple [binary search](https://www.geeksforgeeks.org/binary-search/) on the files names within the partition, we can quickly figure out the segment which contains the message for the given offset **k**. So, _Step 1_ is sorted.

Now that we have the segment which contains the message, how do we extract that message with offset **k**?

From the previous section, we know that every message along with its offset is being stored in the `.log` file. One possible(& naive) way to implement this would be to iterate over the contents of the `.log` file and extract out the message with offset **k**. But this is not efficient as the size of the `.log` file may grow over time, and processing the entire file would be difficult. So how do you think Kafka handles this?

This is where the index file (_.index_) comes into picture. The index file stores a mapping of _relative offset_(4 bytes) to a _numeric value_(4 bytes). This _numeric value_ indicates the position in the `.log` file where the message with _offset_ = (_base offset_ + _relative offset_) is located
Indexing helps consumers to read data starting from any specific offset or using any time range. 
Index file examle:
```
offset: 20 position: 346
offset: 34 position: 692
```
The result indicates that the message with offset **20** ( = 0 + 20) is located at position **346** in 0000000000000000000**0**.log file. Similarily the message with offset **34** ( = 0 + 34) is located at position **692**.

Given such a mapping, we can easily extract a message within a segment for offset **k**. Therefore, _Step 2_ is also sorted. Thus, the `.index` file & `.log` file together, provide an efficient way to extract messages given an offset.

But wait, does Kafka store this mapping for every single offset? No. From the above result we can see the mapping only for offsets **20** and **34**. Having that said, how does Kafka know when to add a entry in the index file? Kafka uses a broker property named `log.index.interval.bytes`. This property indicates how frequently (after how many bytes) an index entry would be added. This can also be configured at the topic level using the property `index.interval.bytes`. By tuning this property, we can control the number of entries in the `.index` file. Try to play around with this property and see for yourself how the entries in the `.index` file change. **log.index.interval.bytes** is 4096 bytes by default. This means that after every 4096 bytes added to the log, an entry gets added to the index file. Suppose the producer is sending records of 100 bytes each to a Kafka topic. In this case, a new index entry will be added to the .index file after every 41 records (41 * 100 = 4100 bytes) appended to the log file.

So if a consumer wants to read starting at a specific offset, a search for the record is made as follows:

- Search for an `.index` file based on its name, which follows the same patterns as the corresponding `.log` file. The file contains the starting offset of the records indexed by that index.
- Search for an entry in the `.index` file where the requested offset falls.
- Use the corresponding bytes offset to access the `.log` file and search for the offset that the consumer wants to start from.


![[Pasted image 20231020212232.png]]

# Timeindex file
As we mentioned, consumers may also want to read the records from a specific timestamp. This is where the .timeindex file comes into the picture. It maintains a timestamp and offset mapping (which maps to the corresponding entry in the .index file), which maps to the actual byte offset in the **.log** file.
Timeindex file example:
```
timestamp: 1586329557553 offset: 20
timestamp: 1586329575827 offset: 34
```

The above mentioned result can be translated as follows

- Messages with 1586329557553 <= created time < 1586329575827, have **20** ( = 0 + 20) <= offset < **34** ( = 0 + 34).
- Messages with created time >= 1586329575827, have their offset >= **34** ( = 0 + 34).
- 
![[Pasted image 20231020212811.png]]
# [Writes](https://kafka.apache.org/documentation/#impl_writes)

The log allows serial appends which always go to the last file. This file is rolled over to a fresh file when it reaches a configurable size (say 1GB). The log takes two configuration parameters: _M_, which gives the number of messages to write before forcing the OS to flush the file to disk, and _S_, which gives a number of seconds after which a flush is forced. This gives a durability guarantee of losing at most _M_ messages or _S_ seconds of data in the event of a system crash.

# Sources
1. https://www.youtube.com/watch?v=B5j3uNBH8X4&list=PLa7VYi0yPIH2PelhRHoFR5iQgflg-y6JA&index=3&ab_channel=Confluent
2. https://kafka.apache.org/documentation/#log
3. https://www.conduktor.io/blog/understanding-kafkas-internal-storage-and-log-retention/
4. https://stackoverflow.com/questions/19394669/why-do-index-files-exist-in-the-kafka-log-directory
5. https://rohithsankepally.github.io/Kafka-Storage-Internals/
6. https://www.youtube.com/watch?v=A2TK7XSs9X4&ab_channel=KnowledgeAmplifier