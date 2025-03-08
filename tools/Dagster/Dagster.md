>[!info] Most information in this doc was taken from https://courses.dagster.io/. The code is also there

# Dagster
**Dagster** is data pipeline orchestrator.  Why do you need orchestrator? To manage tasks! But what does it mean? It means:
- *To schedule tasks*: "Hey, I want to vacuum this table every Monday at 6 pm. Hey, I want to pull data from this API every 2 hours. Hey, I want to get yearly statistics on the first of January at 00:01 so I can open it instead of my New Year present"
- *To provide hierarchy and dependencies*: "Hey, how many tasks will fail if I delete unimportant task with the name `the_most_important_task_in_our_company`? Hey, the task calculates marketing data and it depends on upstream tasks that pulls data from Google, Meta and some random excel file, so don't run it until all upstreams are done!"
- *To observe task status with nice (or not) UI*: "Hey, when was the last time we updated this table? Go on UI and check last successful run for the task in charge of this table!"

> Brain Note: слово table - це і стіл і таблиця, ніколи про це не думав https://stackoverflow.com/questions/10689792/why-is-a-database-table-called-a-table

Dagster structure:
![[Pasted image 20250305144623.png]]
You can read more about each of the component here https://docs.dagster.io/getting-started/concepts. Important thing about Definitions is that only objects included in the definitions will be deployed and visible within the Dagster UI.

> \* Show UI *

## Asset
An asset is an object in persistent storage that captures some understanding of the world. If you have an existing data pipeline, you’re likely already creating assets. For example, your pipeline might incorporate objects like:

- **A database table or view**, such as those in a Google BigQuery data warehouse
- **A file**, such as a file in your local machine or blob storage like Amazon S3
- **A machine learning model**, such as TensorFlow or PyTorch
- **An asset from an integration,** such as a dbt model

\* Show asset in code, show asset in definition *

Now that you’ve defined an asset in code, the next step is to **materialize** it. When an asset is materialized, Dagster runs the asset’s function and creates the asset by persisting the results in storage, such as in a data warehouse. When a materialization begins, it kicks off a **run.**

> \* Show asset in UI and materialize it. Show logs after successful run *

A **dependency** is a relationship between assets. Asset dependencies can be:

- **Downstream**, which means an asset is dependent on another asset
- **Upstream**, which means an asset is depended on by another asset

> \* Show asset lineage *

## Metadata
You can group multiple assets together. An asset group is a way you can keep your assets tidy and simplify keeping track of them in the UI. Additionally, asset groups can make selecting assets for a job easier, as you can refer to an asset group instead of specifying a list of assets.

> \* Show groups and kinds on UI *

Another way of using metadata is to return some result (number of rows in the table or picture in base64 format) so it will be shown on UI and you can see value of this results overtime

## Resources

Resources are the tools and services you use to make assets. For example, a simple ETL (Extract Transform Load) pipeline fetches data from an API, ingests it into a database, and updates a dashboard. External tools and services this pipeline uses could be:

- The API the data is fetched from
- The AWS S3 bucket where the API’s response is stored
- The Snowflake/Databricks/BigQuery account the data is ingested into
- The BI tool the dashboard was made in

I'm thinking about resources as about connections.

> \* Show how we use DuckDB db as resource, check resource usage on UI *

You can use UI to understanding what resources are available and how they’re used. Some common use cases for this info include:

- Identifying potential impacts of a database migration
- Investigating increases in service costs and trying to track down where the growth is coming from

## Jobs and schedules
When working with large asset graphs, you likely don’t want to materialize all of your assets with every run.

Jobs are a Dagster utility to take a slice of your asset graph and focus specifically on running materializations of those assets. You can also customize your materializations and runs with jobs. For example, having multiple jobs can enable running one set of assets in an isolated Kubernetes pod and another selection of assets on a single process.

To select only the assets you want to include, you’ll use the `AssetSelection` class. This class lets you look up and reference assets across your code location. In particular, there will be two methods that you’ll be using:

- `AssetSelection.all()` gives you a list of all asset definitions in the code location
- `AssetSelection.assets([<string>, ...])` which gives you a list of assets that match the asset keys provided (WHY DON'T USE ACTUAL FUNCTION REFERENCE??? And you cannot instead of `func_name.__name__` use  `"func_name"` because of `@asset`)

> \* Show job and schedules in the code and on UI *
## Partitions and backfill
\* Show partition in code *
As we can see in code instead of using hardcoded values for `month_to_fetch` we are using partitions. In this case it is similar to Airflow logical date variable `{{ ds }}`.
The `context` argument provides information about how Dagster is running and materializing your asset. For example, you can use it to find out which partition Dagster is materializing, which job triggered the materialization, or what metadata was attached to its previous materializations.
Taking a closer look at the `taxi_trips_file` asset on UI graph, there are three partitions that represent the three months that were included in the partition.

# IMHO
## What I like
1. Nice UI
2. You can see all relations between assets, jobs, schedules, etc
3. Lineage is kind of built-in
4. I've heard that Dagster fits really good with [dbt](https://docs.dagster.io/integrations/libraries/dbt/transform-dbt)
5. I'm starting getting asset-based idea. Instead of thinking "I want to run this processing every day at 6 PM with and use these resources" you think "I have an asset. What can I do with it?"
6. You can test schedules and sensors
7. Dagster is something more then scheduler
8. You can see where do you use different resources
9.  I'm not sure about my feeling about the fact that some things in Dagster can be made on the Dagster level instead of task itself (e.g. partitions, resources)

## What I don't like
**For every case here show an example!**
1. Why assets dependencies are list of strings, not list of actual functions/references. How to check if I used correct dependency? Maybe by using string we avoiding circular references error?
2. That we are adding resources as input params into function. As a result if resource doesn't exist we will catch an error in runtime instead of compile time. Also it doesn't show up when doing code search
3. I haven't found a way to create assets in different repos. It looks like everything for Dagster must be in the same repo
4. You need to list jobs, assets and schedules in definition
5. To create a task you need to create: asset, job, schedule, and optionally a partition in 4 different places if you use project structure from example. I think it's easier to keep all stuff for the task in one place, so you have asset (task), jobs (group of tasks) and schedules for them in one file, but I'm not sure it's a good practice.
6. If you are going to use a lot of external computations I don't know how useful Dagster will be. For example, how you can use DB connection resource for your task if it runs on k8s cluster? Will it be a simple placeholder?
7. You can use resource (e.g. DuckDB connection) inside the code without using actual resource 🤷🏻‍♂️ so I won't be trackable
8. Once I had a problem just because the order of params for asset ([GitHub issue](https://github.com/dagster-io/dagster/discussions/22576))
9. I doesn't relate to Dagster but oh my god I hate duckdb. I had a lock issue several time because I've forgot to close Python Repl with duck db connection.
10. "The job should include assets with the same partition." Why? It means that I will need to create even more jobs
11. Why kinds are not added automatically based on resources?
12. If assets represents some physical entity for example, a table, then what if I need multiple tasks that write to the same table. It means that I have multiple assets that represent same table? Bruh


## Summary

It really looks like modern orchestrator, with a lot of things going on. It is something more then scheduler and task manager since it takes responsibility for different things: lineage, partitions, resource management, etc. I think it is a good fit for small-medium size projects with advanced data models somewhere in dbt.

> UI is really nice but a bit confusing. I like to look at it but don't like to actually use it

I don't like this dynamic vibe when a lot of things are not stricted and relies on users (dependency on unexisting assets, using resources inside the code without resource declaration, etc). Also it feels like it is one huge DAG instead of a lot small once and hierarchy confusing  makes it even more difficult. You have assets inside jobs, inside definitions, inside code locations. And you also have groups, but they are different to jobs. And don't forget about schedules and partitions to be a separate part but at the same time they relate to jobs 🤯

I think for me it's just a bit difficult to tweak my brain to think about assets instead of tasks and I will not really understand it until I see some good examples of using Dagster.


