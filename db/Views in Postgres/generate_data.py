import psycopg2
import datetime
import polars as pl
from faker import Faker
from random import randint, choice
from datetime import date
import multiprocessing

FILES = []


def write_to_pg():
    conn = psycopg2.connect(
        dbname="user", user="user", password="admin", host="localhost"
    )

    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS person (
            id integer primary key GENERATED ALWAYS AS IDENTITY,
            first_name varchar(255),
            last_name varchar(255),
            gender varchar(1),
            birthday DATE
        );
        ''')

    # Execute SQL query to copy data from CSV into the table
    for filepath in FILES:
        print(f"Inserting {filepath}")
        with open(filepath, 'r') as file:
            cursor.copy_expert("COPY person(first_name,last_name,gender,birthday) FROM STDIN CSV HEADER", file)

        conn.commit()
    cursor.close()
    conn.close()


fake = Faker("en_US")


def generate_row(i):
    if i % 100_000 == 0:
        print(i)
    gender = choice(["M", "F"])
    names = fake.name().split(" ")
    row = {
        "first_name": names[0],
        "last_name": names[1],
        "gender": gender,
        "birthday": date(randint(1980, 2005), randint(1, 12), randint(1, 28)),
    }
    return row


def generate_rows(batch_size):
    with multiprocessing.Pool() as pool:
        return pool.map(generate_row, range(batch_size))


def generate_and_write_csv(num_records):
    batch_size = 1000000
    num_batches = num_records // batch_size
    remaining = num_records % batch_size

    results = []
    for i in range(num_batches):
        new_filepath = f"users/users_{i}.csv"
        rows = generate_rows(batch_size)
        print(f"Generated rows {rows[-1]}")
        df = pl.DataFrame(rows)
        FILES.append(new_filepath)
        df.write_csv(new_filepath)

    if remaining:
        rows = generate_rows(remaining)
        df = pl.DataFrame(rows)
        FILES.append("users/users_rem.csv")
        df.write_csv(f"users/users_rem.csv")

    for result in results:
        result.get()

    print("CSV file generated and written successfully!")


if __name__ == "__main__":
    num_records = 40_000_000
    start_time = datetime.datetime.now()
    generate_and_write_csv(num_records)
    end_time = datetime.datetime.now()

    print("Time taken:", end_time - start_time)
    print(pl.scan_csv("users/users_*").select(pl.len()).collect())

    start_time = datetime.datetime.now()
    write_to_pg()
    end_time = datetime.datetime.now()

    print("Time taken:", end_time - start_time)
