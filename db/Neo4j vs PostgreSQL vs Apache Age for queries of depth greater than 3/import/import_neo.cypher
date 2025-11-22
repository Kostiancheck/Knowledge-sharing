// import nodes
LOAD CSV WITH HEADERS FROM "file:///nodes.csv" AS csvLine
CREATE (p:Person {uid: toInteger(csvLine.uid), name: csvLine.name, age: toInteger(csvLine.age)})

// import nodes (periodic)
:auto LOAD CSV WITH HEADERS FROM "file:///nodes.csv" AS csvLine
CALL {
    WITH csvLine
    CREATE (p:Person {uid: toInteger(csvLine.uid), name: csvLine.name, age: toInteger(csvLine.age)})
} IN TRANSACTIONS OF 10000 ROWS

// index for quick match
CREATE INDEX person_uid_index FOR (n:Person) ON (n.uid)

// import edges (periodic)
:auto LOAD CSV WITH HEADERS FROM "file:///edges.csv" AS csvLine
CALL {
    WITH csvLine
    MATCH (p:Person {uid: toInteger(csvLine.uid)})
    MATCH (f:Person {uid: toInteger(csvLine.friend_id)})
    MERGE (p)-[:FRIENDS_WITH]->(f)
} IN TRANSACTIONS OF 10000 ROWS

// delete (periodic)
CALL apoc.periodic.iterate('MATCH (n) RETURN n', 'DETACH DELETE n', {batchSize:10000})

// get friends of friends (excluding friends)
MATCH q=(n:Person {uid: 790443})-[*2]-(m:Person)
WHERE NOT (n)--(m)
RETURN q
LIMIT 1000

// get friends of friends (only nodes)
MATCH q=(n:Person {uid: 790443})-[*1]-(m:Person)
WITH nodes(q) as nodes
UNWIND nodes as node
RETURN COLLECT(DISTINCT node), count(DISTINCT nodes) as count

// only node ids
MATCH q=(n:Person {uid: 790443})-[*1..3]-(m:Person)
WITH nodes(q) as nodes
UNWIND nodes as node
RETURN COLLECT(DISTINCT node.uid), count(DISTINCT nodes) as count

// count nodes
MATCH (n:Person)
RETURN count(n) as count

// count edges
MATCH (p:Person)-[r]->()
RETURN count(r) as count