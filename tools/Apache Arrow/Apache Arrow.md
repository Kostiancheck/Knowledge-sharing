---
banner: "[[Pasted image 20231003104714.png]]"
---

# What is Arrow
Released in 2016 Apache Arrow is a language-agnostic framework for developing data analytics applications that process columnar data. The main part of the framework is language-independent columnar memory format for flat and hierarchical data, organized for efficient analytic operations on modern hardware like CPUs and GPUs. The Arrow memory format also supports [[Zero copy data access|zero-copy reads]] for lightning-fast data access without serialization overhead. [Many popular projects](https://arrow.apache.org/powered_by/) use Arrow to ship columnar data efficiently or as the basis for analytic engines. [^1] You can think about Arrow like about in-memory [[Parquet]]

The “Arrow Columnar Format” includes a language-agnostic in-memory data structure specification, metadata serialization, and a protocol for serialization and generic data transport.


# Why it can be useful
Without a standard columnar data format, every database and language has to implement its own internal data format. This generates a lot of waste. Moving data from one system to another involves costly serialization and deserialization. In addition, common algorithms must often be rewritten for each data format.

Arrow's in-memory columnar data format is an out-of-the-box solution to these problems. Systems that use or support Arrow can transfer data between them at little-to-no cost. Moreover, they don't need to implement custom connectors for every other system. On top of these savings, a standardized memory format facilitates reuse of libraries of algorithms, even across languages.[^2]
![[Without Apache Arrow.png]]
![[With Apache Arrow.png]]

Imagine that you need to store cache in some kind of DB, you want to make cache back-ups and also make some analytics based on that cache. And now imagine that you don't need to serialize/deserialize it every time and you can do everything using just one data format - Arrow.

# How it works
Apache Arrow processes large amounts of data quickly by using Single Instruction Multiple Data (SIMD, as the name suggests, takes an operation specified in one instruction and applies it to more than one set of data elements at the same time.). Sets of data are broken into batches that fit the cache layers of a CPU. The Apache Arrow project has a standard format allowing for seamless sharing of data between systems instead of using CPU cycles to convert data between formats.
![[Arrow Binary Protocol.png]] [^3]
# Features
1. It can read subset of data from parquet!!!
   ```python
   pq.read_table("example.parquet",
                      columns=["col1"],
                      filters=[
                          ("col1", ">", 5),
                          ("col1", "<", 10),
                      ])
	```
2. You can compress files when you write them [^4]
3. Can be used for gRPC or even remote SQL queries [^5]

Just nice Enterprise solution for complex graphs visualisation and processing https://www.graphistry.com/data-science

# Speed
https://medium.com/@santiagobasulto/pandas-2-0-performance-comparison-3f56b4719f58

[^1]: https://arrow.apache.org/ - Arrow main page
[^2]: https://arrow.apache.org/overview/ - Arrow overview page
[^3]: https://www.youtube.com/watch?v=SFjY7XGfl3M&ab_channel=Dremio - Video from one of the mai Pandas guy
[^4]: https://arrow.apache.org/cookbook/py/io.html - Apache Arrow Python Cookbook
[^5]: https://arrow.apache.org/docs/format/Flight.html

