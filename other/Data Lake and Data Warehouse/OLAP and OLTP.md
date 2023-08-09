Online analytical processing (OLAP) and online transaction processing (OLTP) are data processing systems that help you store and analyze business data. OLAP combines and groups the data so you can analyze it from different points of view. Conversely, OLTP stores and updates transactional data reliably and efficiently in high volumes. OLTP databases can be one among several data sources for an OLAP system [^1]

## OLAP
Benefits: [^2]
1. Faster data-driven decision making
   Performing analytical queries on multiple relational databases is time consuming because the computer system searches through multiple data tables. On the other hand, OLAP systems precalculate and integrate data so business analysts can generate reports faster when needed.
2. Non-technical user support
   OLAP systems make complex data analysis easier for non-technical business users. Business users can create complex analytical calculations and generate reports instead of learning how to operate databases.
3. Integrated data view
   OLAP provides a unified platform for marketing, finance, production, and other business units. Managers and decision makers can see the bigger picture and effectively solve problems.

OLAP system also can be used for debugging and business logic analysis of the main application, because it can contain all changes, so we can check specific cases and how they changed over time.

## OLTP
Typically involves inserting, updating, and/or deleting small amounts of data in a data store to collect, manage, and secure those  [^3]
Benefits: 
1. Enable the real-time execution of large numbers of database transactions
2. Fast response time


## Difference and use cases
OLTP and OLAP are not competitors, but related parts of the same business machine that have different use cases. In general OLTP uses for real-time transactions, but doesn't work well to store a lot of historical data and make advanced analytics. From the other hand OLAP goal is not to run transactions, but to build reports that requires a lot of historical data and advanced analytical queries.

|OLTP  | OLAP |
| ------- | ------- |
|Enable the real-time execution of large numbers of database transactions by large numbers of people|Usually involve querying many records (even all records) in a database for analytical purposes|
|Require lightning-fast response times|Require response times that are orders of magnitude slower than those required by OLTP|
|Modify small amounts of data frequently and usually involve a balance of reads and writes|Do not modify data at all; workloads are usually read-intensive|
|Use indexed data to improve response times|Store data in columnar format to allow easy access to large numbers of records|
|Require frequent or concurrent database backups|Require far less frequent database backup|
|Require relatively little storage space|Typically have significant storage space requirements, because they store large amounts of historical data|
|Usually run simple queries involving just one or a few records|Run complex queries involving large numbers of records|
| Uses normalized or denormalized models |Uses star schema, snowflake schema, or other analytical models |

## Example of OLAP vs. OLTP

Let's consider a large retail company that operates hundreds of stores across the country. The company has a massive database that tracks sales, inventory, customer data, and other key metrics.

The company uses OLTP to process transactions in real time, update inventory levels, and manage customer accounts. Each store is connected to the central database, which updates the inventory levels in real time as products are sold. The company also uses OLTP to manage customer accounts—for example, to track loyalty points, manage payment information, and process returns.

In addition, the company uses OLAP to analyze the data collected by OLTP. The company’s business analysts can use OLAP to generate reports on sales trends, inventory levels, customer demographics, and other key metrics. They perform complex queries on large volumes of historical data to identify patterns and trends that can inform business decisions. They identify popular products in a given time period and use the information to optimize inventory budgets [^1]

[^1]: https://aws.amazon.com/compare/the-difference-between-olap-and-oltp/?nc1=h_ls
[^2]: https://aws.amazon.com/what-is/olap/
[^3]: https://www.oracle.com/database/what-is-oltp/