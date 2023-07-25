// including
MATCH q=(n:Person {uid: 790443})-[*1..2]-(m:Person)
RETURN DISTINCT m

// excluding + limit
MATCH q=(n:Person {uid: 790443})-[*2]-(m:Person)
WHERE NOT (n)--(m)
RETURN m
LIMIT 1000

// using APOC
MATCH (p:Person {uid: 790443})
    CALL apoc.path.subgraphNodes(p, {
        relationshipFilter: "FRIENDS_WITH",
        minLevel: 1,
        maxLevel: 5
    })
    YIELD node
RETURN node;