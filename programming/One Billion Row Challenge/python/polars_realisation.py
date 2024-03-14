import polars as pl


# Created by Koen Vossen,
# Github: https://github.com/koenvo
# Twitter/x Handle: https://twitter.com/mr_le_fox
# https://x.com/mr_le_fox/status/1741893400947839362?s=20
def create_polars_df():
    pl.Config.set_streaming_chunk_size(4000000)
    return (

        pl.scan_csv("../temperatures.csv", separator=",", has_header=False, new_columns=["city", "measure"],
                    schema={"city": pl.String, "measure": pl.Float64})
        .group_by("city")
        .agg(
            min=pl.col("measure").min(),
            mean=pl.col("measure").mean(),
            max=pl.col("measure").max()
        )
        .sort("city")
        .collect(streaming=True)
    )


import time

start_time = time.time()
df = create_polars_df()
print(df.head(5))
took = time.time() - start_time
df.write_csv("../polars_results.csv")

print(f"Polars Took: {took:.2f} sec")
