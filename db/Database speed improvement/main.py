import random
import time
from datetime import date
from multiprocessing import Pool, cpu_count

import psycopg2
from faker import Faker

GENDERS = {"M": "male", "F": "female"}

NUMBER_OF_RECORDS = 40_000_000

PROCESSES = cpu_count() - 1


def generate_chunk(chunk: int, chunk_num: int) -> None:
    fake = Faker("en_US")
    conn = psycopg2.connect(
        dbname="user", user="user", password="admin", host="localhost"
    )
    cursor = conn.cursor()
    persons = []

    for i in range(chunk):
        gender = random.choice(["M", "F"])
        names = fake.name().split(" ")
        person = (
            i,
            names[0],
            names[1],
            gender,
            date(
                random.randint(1980, 2005), random.randint(1, 12), random.randint(1, 28)
            ),
        )
        persons.append(person)
        if i % 100 == 0:
            args_str = ",".join(
                cursor.mogrify("(%s,%s,%s,%s,%s)", i).decode("utf-8") for i in persons
            )
            cursor.execute("INSERT INTO person VALUES " + args_str)
            conn.commit()
            persons = []
        if i % 100_000 == 0:
            print(f"Batch {i} of chunk {chunk_num} inserted")
    cursor.close()
    conn.close()


if __name__ == "__main__":
    start = time.time()

    conn = psycopg2.connect(
        dbname="user", user="user", password="admin", host="localhost"
    )
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS person (
            id int,
            first_name varchar(255),
            last_name varchar(255),
            gender varchar(1),
            birthday DATE
        );                    
    """)
    conn.commit()
    cursor.close()
    conn.close()

    # see if on Mac: https://stackoverflow.com/questions/67999589/multiprocessing-with-pool-throws-error-on-m1-macbook
    with Pool(processes=PROCESSES) as pool:
        chunks = [(NUMBER_OF_RECORDS // PROCESSES, i) for i in range(PROCESSES)]
        pool.starmap(generate_chunk, chunks)

    end = time.time()
    print(f"Finished after {end - start}")
