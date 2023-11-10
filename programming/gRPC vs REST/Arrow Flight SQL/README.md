`docker run --rm -p 5432:5432 -p 15432:15432 -e POSTGRES_PASSWORD=postgres --name sample-postgres $(docker build -q .)`

https://arrow.apache.org/docs/format/FlightSql.html

Arrow Flight SQL is an experimental protocol for interacting with SQL db using Arrow columnar in-memory data format. The communication is done with Arrow Flight RPC framework.

PostgreSQL adapter: 
- https://arrow.apache.org/flight-sql-postgresql/0.1.0/install.html
- https://github.com/apache/arrow-flight-sql-postgresql/tree/main

DuckDB example: https://github.com/voltrondata/flight-sql-server-example

Reasoning behind Arrow Flight SQL: https://voltrondata.com/resources/apache-arrow-flight-sql-arrow-for-every-database-developer

Video (Why Arrow Flight SQL): https://www.youtube.com/watch?v=HavgysXOlyo

