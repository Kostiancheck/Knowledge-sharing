from datetime import datetime
import neo4j

URI = "bolt://localhost:7687"
AUTH = ("neo4j", "testtest")

with neo4j.GraphDatabase.driver(URI, auth=AUTH) as driver:
    driver.verify_connectivity()

    print(f"started at {datetime.now()}")
    nodes = driver.execute_query(
        """MATCH q=(n:Person {uid: 790443})-[*1..3]-(m:Person)
            WITH nodes(q) as nodes
            UNWIND nodes as node
            RETURN COLLECT(DISTINCT node.uid), count(DISTINCT nodes) as count"""
    )
    print(f"finished at {datetime.now()}")
    print(nodes[0][-1]["count"])