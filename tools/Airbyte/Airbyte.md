# Local setup
> Installation may take up to 15 minutes depending on your internet connection (c) [[#Sources|[1]]]

15 minutes? Bruh

## UI
\* Click through all tabs *
Nice but slow

# Examples
\* Show how I've created sources, destinations and connections *

\* Say about schemas and that maybe if we update github connection to use destination schema it will upload data in better format. Try it life *

# ETL and ELT
**E**xtract - extracting data from one or more sources
**T**ransform - transforming it to meet the target data store (DWh, DB) requirements
**L**oad -  loading it into a target data store

**ELT** has the same steps but in different order. As a result transformation takes place in data store itself

![[Pasted image 20250403005723.png|600]]
# How Airbyte works

![[Pasted image 20250403011506.png]]
Here is the general overview  of Airbyte architecture, but tbh I don't really care about it. I'm interested in how Airbyte connects different sources with different destinations in any combinations. For this they use their own protocol.

The Airbyte Protocol describes a series of standard components and all the interactions between them in order to declare an ELT pipeline. All message passing across components is done via serialized JSON messages for inter-process communication. 

Airbyte's implementation of the protocol is all done in docker. It uses a direct stream pipeline between Docker containers via stdout/stdin. When a sync job starts Airbyte launches two containers:
- _source_ Docker container
- _destination_ Docker container

Worker process reads stdout from the source container line by line (each line is a JSON message conforming to the Airbyte Protocol) and immediately writes each message to the stdin of the destination container.

To support failure recovery and incremental syncs, Airbyte uses:
- **STATE messages**: emitted by the source and confirmed by the destination.
- **Metadata DB (PostgreSQL)**: to persist job configs, state snapshots, logs, etc.
- [Temporal](https://temporal.io/): as the orchestration engine to manage retries and sync lifecycle.

Airbyte protocol have few types of messages:
1. **`SPEC`** – describes the connector's configuration schema
2. **`CONNECTION_STATUS`** – indicates if the connector can connect with given config
3. **`CATALOG`** – lists available streams and their schemas
4. **`RECORD`** – contains a single data record from the source
5. **`STATE`** – represents the sync progress for incremental syncing
6. **`LOG`** – contains log messages (info, warning, error) for observability

# My thoughts
✅
- nice user-friendly UI
- easy to set up new "pipelines". I was shocked how easy it is
- connectors can be triggered from Airflow, Dagster, etc

❌
- you can do only what is available (obviously). Want something custom? Good luck
- could be difficult to debug
- json-based internal protocol doesn't sound like scalable solution. 
	- Won't work for big data
	- Let's say you want export data from google sheets to csv file in s3. Instead of `google sheet -> csv` you have `google sheet -> json -> csv`
- somebody can change your source/destination/connection because everyone can change anything
- no easy options for CI, tests, etc for your connections.

I would use it for light-weight non-critical pipelines to automate manual things like "export simple google sheets as csv and upload it into s3", "upload Google Ads information into our Data warehouse" and so one to make life of non-technical users of your Data platform easier. But for more advanced or critical pipelines I would still write my own code and run it via something like Airflow.



# Sources
1. Quick start guide and uninstall https://docs.airbyte.com/using-airbyte/getting-started/oss-quickstart
2. Architecture overview (with useless diagram) https://docs.airbyte.com/understanding-airbyte/high-level-view. You can check other articles in the section _Understanding Airbyte_
3. Airbyte protocol specs https://docs.airbyte.com/understanding-airbyte/airbyte-protocol
4. Airbyte protocol how it works https://docs.airbyte.com/understanding-airbyte/airbyte-protocol-docker

