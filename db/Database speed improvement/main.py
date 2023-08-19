import random
import time
from datetime import date
from multiprocessing import Pool, cpu_count

import psycopg2
from faker import Faker

NUMBER_OF_RECORDS = 40_000_000
PROCESSES = cpu_count() - 1


def generate_chunk(chunk: int, chunk_num: int) -> None:
    fake = Faker("en_US")
    conn = psycopg2.connect(
        dbname="user", user="user", password="admin", host="localhost"
    )
    cursor = conn.cursor()
    persons = []

    commit_size = chunk // 10 or chunk # if less than 10 (for last chunk)
    for i in range(chunk):
        gender = random.choice(["M", "F"])
        names = fake.name().split(" ")
        person = (
            names[0],
            names[1],
            gender,
            date(
                random.randint(1980, 2005), random.randint(1, 12), random.randint(1, 28)
            ),
        )
        persons.append(person)
        if i % commit_size == 0 or i + 1 == chunk:
            args_str = ",".join(
                cursor.mogrify("(%s,%s,%s,%s)", i).decode("utf-8") for i in persons
            )
            cursor.execute(
                "INSERT INTO person (first_name, last_name, gender, birthday) VALUES "
                + args_str
            )
            conn.commit()
            persons = []
            print(f"Batch {i} of chunk {chunk_num} inserted")
    cursor.close()
    conn.close()


if __name__ == "__main__":
    start = time.time()

    conn = psycopg2.connect(
        dbname="user", user="user", password="admin", host="localhost"
    )
    cursor = conn.cursor()

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS person (
            id integer primary key GENERATED ALWAYS AS IDENTITY,
            first_name varchar(255),
            last_name varchar(255),
            gender varchar(1),
            birthday DATE
        );                    
    """
    )
    conn.commit()
    cursor.close()
    conn.close()

    # see if on Mac: https://stackoverflow.com/questions/67999589/multiprocessing-with-pool-throws-error-on-m1-macbook
    with Pool(processes=PROCESSES) as pool:
        per_chunk = NUMBER_OF_RECORDS // PROCESSES
        chunks = [(per_chunk, i) for i in range(PROCESSES)]
        if per_chunk * PROCESSES < NUMBER_OF_RECORDS:
            chunks.append((NUMBER_OF_RECORDS - PROCESSES * per_chunk, PROCESSES))
        pool.starmap(generate_chunk, chunks)

    end = time.time()
    print(f"Finished after {end - start}")
