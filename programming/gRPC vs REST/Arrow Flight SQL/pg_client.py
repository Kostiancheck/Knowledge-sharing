import adbc_driver_postgresql.dbapi
import time

if __name__=="__main__":
    uri = "postgresql://postgres:postgres@172.17.0.1:5432/wdi"
    with adbc_driver_postgresql.dbapi.connect(uri) as conn:
        with conn.cursor() as cur:
            print("starting")
            start = time.time()
            cur.execute("SELECT COUNT(id) FROM regions;")
            x = cur.fetch_arrow_table()
            finish = time.time() 
            print(f"finished in {finish - start}")
            print(x)