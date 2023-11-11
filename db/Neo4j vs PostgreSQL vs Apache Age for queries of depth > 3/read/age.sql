-- in pgAdmin, directed depth 1
LOAD 'age';
SET search_path = ag_catalog, "$user", public;
SELECT * FROM cypher('persons', $$
					 
MATCH q=(n:Person {uid: 790444})-[]->(m:Person)
RETURN DISTINCT m
					 
$$) as (friends agtype);


-- directed depth 2
LOAD 'age';
SET search_path = ag_catalog, "$user", public;
SELECT * FROM cypher('persons', $$

MATCH q=(n:Person {uid: 790444})-[]->(m:Person)-[]->(mm:Person)
RETURN DISTINCT mm

$$) as (friends agtype);


-- undirected by union, depth 1
LOAD 'age';
SET search_path = ag_catalog, "$user", public;
SELECT * FROM cypher('persons', $$
					 
MATCH q=(n:Person {uid: 790444})-[]->(m:Person)
RETURN DISTINCT m
UNION
MATCH q=(n:Person {uid: 790444})<-[]-(m:Person)
RETURN DISTINCT m
					 
$$) as (friends agtype);


-- undirected by union, depth 2 (DO NOT RUN)
LOAD 'age';
SET search_path = ag_catalog, "$user", public;
SELECT * FROM cypher('persons', $$
					 
MATCH q=(n:Person {uid: 790444})-[]->(m:Person)
RETURN DISTINCT m
UNION
MATCH q=(n:Person {uid: 790444})<-[]-(m:Person)

WITH DISTINCT m
MATCH (m)-[]->(mm:Person)
RETURN mm
UNION
MATCH (m)<-[]-(mm:Person)
RETURN mm
						 
$$) as (friends agtype);