from datetime import datetime
from neomodel import (
    db,
    IntegerProperty,
    RelationshipTo,
    StringProperty,
    StructuredNode,
    config,
)
import pandas as pd

config.DATABASE_URL = "bolt://neo4j:testtest@localhost:7687"


class Person(StructuredNode):
    uid = IntegerProperty(unique_index=True)
    name = StringProperty(index=True)
    age = IntegerProperty(index=True)

    friend = RelationshipTo("Person", "HAS_FRIEND")


def upload_nodes(fname: str):
    df = pd.read_csv(fname, dtype={"uid": int, "age": int})
    k = 0
    for chunk in range(0, df.shape[0], 1000):
        with db.transaction:
            df_chunk = df[chunk : chunk + 1000]
            df_chunk.apply(lambda x: Person(**x).save(), axis=1)
        k += 1
        print(f"processed chunk {k}", end="\r")


def upload_edges(fname: str):
    def upload_edge(row: pd.Series):
        start_node = Person.nodes.get(uid=row["uid"])
        end_node = Person.nodes.get(uid=row["friend_id"])
        start_node.friend.connect(end_node)
        start_node.save()

    df = pd.read_csv(fname, dtype={"uid": int, "age": int})
    k = 0
    for chunk in range(0, df.shape[0], 1000):
        with db.transaction:
            df_chunk = df[chunk : chunk + 1000]
            df_chunk.apply(upload_edge, axis=1)
            k += 1
            print(f"processed chunk {k}", end="\r")


if __name__ == "__main__":
    print(f"started at {datetime.now()}")

    upload_nodes("nodes.csv")
    print(f"finished importing nodes at {datetime.now()}")
    upload_edges("edges.csv")
    print(f"finished importing edges at {datetime.now()}")

    print(f"finished at {datetime.now()}")
