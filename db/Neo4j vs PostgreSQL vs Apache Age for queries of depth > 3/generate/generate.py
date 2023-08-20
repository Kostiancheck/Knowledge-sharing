import csv
import random
from datetime import datetime

import numpy as np
from distribution import outcomes, probabilities
from faker import Faker

fake = Faker()


def gen_nodes(fname: str, total: int) -> None:
    total = total + 1
    with open(fname, "w") as f:
        writer = csv.writer(f)
        writer.writerow(["uid", "name", "age"])
        for i in range(1, total):
            name = fake.name()
            age = random.randint(18, 80)
            writer.writerow([i, name, age])
            if i % 1000 == 0:
                print(f"processed {i}", end="\r")


def gen_edges(fname: str, total: int) -> None:
    total = total + 1
    with open(fname, "w") as f:
        writer = csv.writer(f)
        writer.writerow(["uid", "friend_id"])
        for i in range(1, total):
            friends_number = np.random.choice(outcomes, size=1, p=probabilities)[0]
            friend_ids = random.sample(range(1, total), friends_number)
            for friend_id in friend_ids:
                writer.writerow([i, friend_id])
            if i % 1000 == 0:
                print(f"processed {i}", end="\r")


if __name__ == "__main__":
    print(f"started at {datetime.now()}")
    gen_nodes("../nodes.csv", 1_000_000)
    print(f"finished generating nodes at {datetime.now()}")
    gen_edges("../edges.csv", 1_000_000)
    print(f"finished generating edges at {datetime.now()}")

    # gen_nodes("ten_mil_nodes.csv", 10_000_000)
    # print(f"finished 10 mil nodes at {datetime.now()}")
    # gen_edges("ten_mil_edges.csv", 10_000_000)
    # print(f"finished 10 mil edges at {datetime.now()}")
    
    print(f"finished at {datetime.now()}")
