---
banner: "![[boats-ready-to-launch-royalty-free-image-1586887439.jpg]]"
banner_y: 0.584
---

# What is Data Lake 
A data lake is a centralized repository that allows you to store all your structured and unstructured data at any scale. You can store your data as-is, without having to first structure the data. [^1]

## Data Lake 1.0
Let's talk about first version of data lake ("data lake 1.0") that that appeared during the big data era.

Instead of imposing tight structural limitations on data, why not simply dump all of your data - structured and unstructured - into a central location? The data lake promised to be a democratizing force, liberating the business to drink from a fountain of limitless data. Data lake 1.0 started with HDFS. As the cloud grew in popularity, these data lakes moved to cloud-based object storage, with extremely cheap storage costs and virtually limitless storage capacity. When this data needs to be queried or transformed, you have access to nearly unlimited computing power by spinning up a cluster on demand, and you can pick your favorite data-processing technology for the task at hand—MapReduce, Spark, Ray, Presto, Hive, etc.
But the lack of data management, schema management, huge sizes of useless data and difficulty to run processing can led to that Data Lake become Data Swamp. Also Data Lake is read-only, so you cannot easily delete or update data [^2]

## Next Generation Data Lakes
Databricks introduced the notion of a **data lakehouse**. The lakehouse incorporates the controls, data management, and data structures found in a data warehouse while still housing data in object storage and supporting a variety of query and transformation engines. In particular, the data lakehouse supports atomicity, consistency, isolation, and durability (ACID) transactions, a big departure from the original data lake, where you simply pour in data and never update or delete it. The term data lakehouse suggests a convergence between data lakes and data warehouses.

The technical architecture of cloud data warehouses has evolved to be very similar to a data lake architecture. Cloud data warehouses separate compute from storage, support petabyte-scale queries, store unstructured text and semistructured objects, and integrate with advanced processing technologies such as Spark or Beam.

So the future for data architectures is some kind of synergy of Data Lake and Data Warehouse.

[^1]: [[Fundamentals_of_Data_Engineering.pdf]] - page 150
[^2]: https://aws.amazon.com/big-data/datalakes-and-analytics/what-is-a-data-lake/
