import json

import age
import numpy
import pandas as pd
import psycopg2
from psycopg2.extensions import AsIs, register_adapter


def addapt_numpy_float64(numpy_float64):
    return AsIs(numpy_float64)


def addapt_numpy_int64(numpy_int64):
    return AsIs(numpy_int64)


register_adapter(numpy.float64, addapt_numpy_float64)
register_adapter(numpy.int64, addapt_numpy_int64)

GRAPH_NAME = "persons"
conn = psycopg2.connect(
    host="localhost",
    port="5432",
    dbname="neo4j",
    user="postgres",
    password="testtest",
)

age.setUpAge(conn, GRAPH_NAME)

with conn.cursor() as cursor:
    try:
        df = pd.read_csv("../nodes.csv", dtype={"uid": int, "age": int})
        k = 0
        for chunk in range(0, df.shape[0], 1000):
            df_chunk = df[chunk : chunk + 1000]
            df_chunk.apply(lambda row:
                cursor.execute("""SELECT * from cypher(%s, $$
                            CREATE (n:Person {uid: %s, name: %s, age: %s})
                            $$) as (v agtype); """, (GRAPH_NAME, row["uid"], row["name"], row["age"]) )
            , axis=1)
            k += 1
            print(f"processed chunk {k}", end='\r')
        conn.commit()
    except Exception as ex:
        print(type(ex), ex)
        conn.rollback()

    # try:
    #     df = pd.read_csv("../edges.csv", dtype={"uid": int, "friend_id": int})
    #     k = 0
    #     for chunk in range(0, df.shape[0], 1000):
    #         df_chunk = df[chunk : chunk + 1000]
    #         df_chunk.apply(
    #             lambda row: cursor.execute(
    #                 """SELECT * from cypher(%s, $$ 
    #                         MATCH (n:Person {uid: %s})
    #                         MATCH (m:Person {uid: %s})
    #                         CREATE (n)-[:FRIENDS_WITH]->(m) 
    #                         $$) as (v agtype); """,
    #                 (GRAPH_NAME, row["uid"], row["friend_id"]),
    #             ),
    #             axis=1,
    #         )
    #         k += 1
    #         print(f"processed chunk {k}", end='\r')
    #     conn.commit()
    # except Exception as ex:
    #     print(type(ex), ex)
    #     conn.rollback()
