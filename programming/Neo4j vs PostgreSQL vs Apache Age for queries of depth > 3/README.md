Compare Neo4j and Postgres (and Apache Age) performance for simple Friends-of-Friends query.

- `generate` folder contains Python scripts for generating fake data - 1 million nodes and random number of edges between them (turned out to be 18.8 million edges for test generation)
- `import` folder contains commands to import this data into Neo4j/Postgres/Age
- `read` folder contains commands to perform the same logical query (friends of friends)

Note that for proper comparison, hash index must be created in Postgres and lookup index in Neo4j for field "uid".

Results: Postgres fails miserably for "Firends-of-Friends" query of depth 5, while Neo takes almost 11 seconds to perform it (using APOC library). Apache Age is basically unusable because of bugs and incompatibility with Neo4j-style Cypher syntax (might be also a bug)
