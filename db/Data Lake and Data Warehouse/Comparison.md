# DWh vs. Data Lake

|Characteristics|Data Warehouse|Data Lake|
|---|---|---|
|Data|Relational data from transactional systems, operational databases, and line of business applications|All data, including structured, semi-structured, and unstructured|
|Schema|Often designed prior to the data warehouse implementation but also can be written at the time of analysis<br><br>(schema-on-write or schema-on-read)|Written at the time of analysis (schema-on-read)|
|Price/Performance|Fastest query results using local storage|Query results getting faster using low-cost storage and decoupling of compute and storage|
|Data quality|Highly curated data that serves as the central version of the truth|Any data that may or may not be curated (i.e. raw data)|
|Users|Business/Data analysts | data scientists, data engineers|
|Analytics|Batch reporting, BI, and visualizations|Machine learning, exploratory analytics, data discovery |
[^1] [^2]

# DWh vs DL vs DLh [^3] [^4]
![[DWh DL DLh.png]]
![[DWh DL DLh 2.png]]

[^1]: https://aws.amazon.com/data-warehouse/ - AWS article about DWh
[^2]: https://www.youtube.com/watch?v=FxpRL0m9BcA&list=WL&index=15&ab_channel=SeattleDataGuy -  Data Lake and DWh
[^3]: https://www.databricks.com/glossary/data-lakehouse - Databricks article about Lakehouse
[^4]: https://www.databricks.com/discover/data-lakes - one more Databricks article about DLh and DL