spells_url = "https://raw.githubusercontent.com/rfordatascience/tidytuesday/main/data/2024/2024-12-17/spells.csv"
penguins_url = "https://raw.githubusercontent.com/rfordatascience/tidytuesday/main/data/2025/2025-04-15/penguins_raw.csv"

import duckdb

# Connect to or create the DuckDB database
con = duckdb.connect("metabase.duckdb")

# Read directly from the CSV URL and create tables
con.execute(f"""
    CREATE OR REPLACE TABLE spells AS
    SELECT * FROM read_csv_auto('{spells_url}')
""")

con.execute(f"""
    CREATE OR REPLACE TABLE penguins AS
    SELECT * FROM read_csv_auto('{penguins_url}')
""")


# Optional: confirm number of rows
print(con.execute("SELECT COUNT(*) FROM spells").fetchone()[0], "rows written to 'spells' table.")
print(con.execute("SELECT COUNT(*) FROM penguins").fetchone()[0], "rows written to 'penguins' table.")


con.close()