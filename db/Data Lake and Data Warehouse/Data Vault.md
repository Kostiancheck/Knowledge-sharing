Data Vault it's yet another Data warehouse implementation (see [[Data Marts]] and [[Data Warehouse (DWh)| DWh]] about Kimbal and Inmon approaches). Instead of representing business logic in facts, dimensions, or highly normalized tables, a data vault simply loads data from source systems directly into a handful of purpose-built tables in an insert-only manner.

A data vault consists of three main types of tables: hubs, links, and satellites. 
- **Hubs** - Each hub represents a core business concept, such as they represent Customer Id/Product Number/Vehicle identification number (VIN). Users will use a business key to get information about a Hub. The business key may have a combination of business concept ID and sequence ID, load date, and other metadata information.
- **Links** - Links represent the relationship between Hub entities.
- **Satellites** - Satellites fill the gap in answering the missing descriptive information on core business concepts. Satellites store information that belongs to Hub and relationships between them[^2]
A user will query a hub, which will link to a satellite table containing the query’s relevant attributes.


![[Data Vault.png]]

# How to build Data Vault [^3]
[Pie Insurance](https://pieinsurance.com/), a leading small business insurtech, leverages a data vault 2.0 (2013) architecture (with some minor deviations) to achieve their data integration objectives around scalability and use of metadata. So let's see how they did it.

Data vault architecture implementation includes 4 conceptual layers of data architecture that make up their data pipeline ecosystem: 

- **Ingestion Layer**– Landing and Staging raw data from source systems.
    - **Landing** – Source files landed in AWS S3 buckets
    - **Staging** – Raw Source Data stored in VARIANT columns within Snowflake tables.
- **Curation Layer** – Organizes the raw data.
    - **Raw Data Vault** – Within Snowflake environment and has minor transformations mapping it into Hub, Satellite, and Link tables as recommended by the Data Vault 2.0 methodology. 
    - **Business Data Model** – Pie’s data vault design is the physical model of their business data model – as opposed to trying to design based on each source system’s data. This gives them a single model to conform to, regardless of the source.
- **Transformation Layer** – Transform and cleans data using business logic.
    - **Business Vault** – Pre-Transformed data, following business transformation rules.
    - **Information Warehouse** – This layer alone follows the dimensional (or Kimball) star (or snowflaked) data model.
- **Presentation Layer** – Reporting layer for the vast majority of users. This layer has minimal transformation rules.
    - **BI/Reporting Tool(s)** – Pie uses Looker, which has a metadata layer that reflects the “Information Warehouse” (transformed data).
    - **Future Reporting Tool Plug-in** – This allows future reporting or querying tools to be added without major development, because the data is already transformed in the database-layer.
    - **Dynamic Rules** – Dynamic rules or calculations that need to change depending on different grains or aggregated views self-service users need to see their information.

“We think of our architecture from left to right. The far left is data in its most raw form and the far right is information that has been fully transformed, cleansed, and is ready to be consumed by the business"
![[Data Vault layers.png]]

# Example [^3]
Let's say we have a table with sales data
![[Data Vault example 1.png|200]]
So we will move this data to the next hub, link, satellite an reference tables
![[Data Vault example 2.png|500]]



[^1]: [[Fundamentals_of_Data_Engineering.pdf]] - page 422
[^2]: https://www.databricks.com/glossary/data-vault - Databricks Data Vault article
[^3]: https://www.montecarlodata.com/blog-data-vault-architecture-data-quality/
[^4]: https://www.youtube.com/watch?v=D914nNWGP6E&t=80s&ab_channel=nullQueries - nullQueries short video about Data Vault