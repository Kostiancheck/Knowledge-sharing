Run docker:

```
docker run -p 7474:7474 -p 7687:7687 -e NEO4J_AUTH=neo4j/admin123 neo4j

```

Harry Potter v1 initial:

```
CREATE (harry:Person {name: 'Daniel Radcliffe', type: 'actor'})
CREATE (hermione:Person {name: 'Emma Watson', type: 'actor'})
CREATE (ron:Person {name: 'Rupert Grint', type: 'actor'})
CREATE (albus:Person {name: 'Richard Harris', type: 'actor'})
CREATE (chris:Person {name: 'Chris Columbus', type: 'director'})

CREATE (movie:Movie {title: 'Harry Potter and the Philosopher\\'s Stone', year: 2001})

CREATE (harry)-[:ACTED_IN {role: "Harry Potter"}]->(movie)
CREATE (hermione)-[:ACTED_IN {role: "Hermione Granger"}]->(movie)
CREATE (ron)-[:ACTED_IN {role: "Ron Weasley"}]->(movie)
CREATE (albus)-[:ACTED_IN {role: "Albus Dumbledore"}]->(movie)
CREATE (chris)-[:DIRECTED]->(movie)

WITH movie as m
MATCH p=(n)-[r]->(m)
RETURN p

```

Harry Potter v1 add another movie:

```
MATCH (harry:Person {name: 'Daniel Radcliffe'})
MATCH (hermione:Person {name: 'Emma Watson'})
MATCH (ron:Person {name: 'Rupert Grint'})
CREATE (albus:Person {name: 'Michael Gambon', type: 'actor'})
CREATE (alfonso:Person {name: 'Alfonso Cuarón', type: 'director'})

CREATE (movie3:Movie {title: 'Harry Potter and the Prisoner of Azkaban', year: 2004})

CREATE (harry)-[:ACTED_IN {role: "Harry Potter"}]->(movie3)
CREATE (hermione)-[:ACTED_IN {role: "Hermione Granger"}]->(movie3)
CREATE (ron)-[:ACTED_IN {role: "Ron Weasley"}]->(movie3)
CREATE (albus)-[:ACTED_IN {role: "Albus Dumbledore"}]->(movie3)
CREATE (alfonso)-[:DIRECTED]->(movie3)

WITH movie3
MATCH p=(n:Person)-[r]->(m:Movie)
RETURN p

```

Delete all:

```
MATCH (n)
DETACH DELETE n

```

Harry Potter v2 initial:

```
CREATE (radcliffe:Person:Actor {name: 'Daniel Radcliffe'})
CREATE (watson:Person:Actor {name: 'Emma Watson'})
CREATE (grint:Person:Actor {name: 'Rupert Grint'})
CREATE (harris:Person:Actor {name: 'Richard Harris'})
CREATE (columbus:Person:Director {name: 'Chris Columbus'})

CREATE (potter:Role {name: 'Harry Potter'})
CREATE (granger:Role {name: 'Hermione Granger'})
CREATE (weasley:Role {name: 'Ron Weasley'})
CREATE (dumbledore:Role {name: 'Albus Dumbledore'})

CREATE (movie:Movie {title: "Harry Potter and the Philosopher's Stone", year: 2001})

CREATE (radcliffe)-[:HAS_ROLE]->(potter)
CREATE (watson)-[:HAS_ROLE]->(granger)
CREATE (grint)-[:HAS_ROLE]->(weasley)
CREATE (harris)-[:HAS_ROLE]->(dumbledore)

CREATE (potter)-[:ROLE_IN]->(movie)
CREATE (granger)-[:ROLE_IN]->(movie)
CREATE (weasley)-[:ROLE_IN]->(movie)
CREATE (dumbledore)-[:ROLE_IN]->(movie)

CREATE (columbus)-[:DIRECTED]->(movie)

CREATE (radcliffe)-[:ACTED_IN]->(movie)
CREATE (watson)-[:ACTED_IN]->(movie)
CREATE (grint)-[:ACTED_IN]->(movie)
CREATE (harris)-[:ACTED_IN]->(movie)

WITH movie as m
MATCH x=(p)-[*1..2]->(m)
RETURN x

```

Harry Potter v2 add second movie:

```
MATCH (radcliffe:Actor {name: 'Daniel Radcliffe'})
MATCH (watson:Actor {name: 'Emma Watson'})
MATCH (grint:Actor {name: 'Rupert Grint'})
MATCH (potter:Role {name: 'Harry Potter'})
MATCH (granger:Role {name: 'Hermione Granger'})
MATCH (weasley:Role {name: 'Ron Weasley'})
MATCH (dumbledore:Role {name: 'Albus Dumbledore'})

CREATE (gambon:Person:Actor {name: 'Michael Gambon'})
CREATE (cuaron:Person:Director {name: 'Alfonso Cuarón'})
CREATE (movie3:Movie {title: 'Harry Potter and the Prisoner of Azkaban', year: 2004})

CREATE (gambon)-[:HAS_ROLE]->(dumbledore)
CREATE (cuaron)-[:DIRECTED]->(movie3)

CREATE (radcliffe)-[:ACTED_IN]->(movie3)
CREATE (watson)-[:ACTED_IN]->(movie3)
CREATE (grint)-[:ACTED_IN]->(movie3)
CREATE (gambon)-[:ACTED_IN]->(movie3)

CREATE (potter)-[:ROLE_IN]->(movie3)
CREATE (granger)-[:ROLE_IN]->(movie3)
CREATE (weasley)-[:ROLE_IN]->(movie3)
CREATE (dumbledore)-[:ROLE_IN]->(movie3)

WITH movie3
MATCH p=(n)-[*1..2]->(m)
RETURN p

```