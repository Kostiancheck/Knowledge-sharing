import pandas as pd
import pyarrow.csv
import queue
import threading


def process_df(df: pd.DataFrame) -> pd.DataFrame:
    return df.groupby("city")["temperature"].agg(["min", "max", "sum", "count"])


def worker():
    while True:
        df = q.get()
        results.append(process_df(df))
        q.task_done()


if __name__ == "__main__":
    q = queue.Queue(maxsize=10)

    results = []

    threading.Thread(target=worker, daemon=True).start()

    with pyarrow.csv.open_csv(
        "temperatures.csv",
        read_options=pyarrow.csv.ReadOptions(
            block_size=5_000_000, column_names=["city", "temperature"]
        ),
    ) as reader:
        for chunk in reader:
            q.put(chunk.to_pandas())

    q.join()

    cities = (
        pd.concat(results)
        .groupby("city")
        .agg({"min": "min", "max": "max", "sum": "sum", "count": "sum"})
    )
    cities["mean"] = cities["sum"] / cities["count"]
    print(cities.head())
