import csv
from faker import Faker

if __name__=="__main__":
    fake = Faker()

    with open("test.csv", "w") as f:
        writer = csv.writer(f)
        for _ in range(1_000_0):
            name = fake.name()
            text = fake.paragraph(10).replace("\n", " ")
            writer.writerow([name, text])
