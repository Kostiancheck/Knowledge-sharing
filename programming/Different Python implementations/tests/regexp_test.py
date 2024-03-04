import re
import csv

if __name__ == "__main__":
    to_find = []

    with open("to_find.csv", "r") as to_find_f:
        reader = csv.reader(to_find_f)
        for row in reader:
            to_find.append(row[0])

    with open("test.csv", "r") as f:
        reader = csv.reader(f)
        rows = [row for row in reader]
        for test in to_find:
            print(f"----looking for word {test}----")
            for i, row in enumerate(rows):
                found = re.search(rf"(^|\s){test}(\s|$)", row[1], re.I)
                if found:
                    colored_text = f"\033[38;5;3m{test}\033[0;0m"
                    out_text = re.sub(rf"(^|\s){test}(\s|$)", rf"\1{colored_text}\2", row[1], flags=re.I)
                    print(f'Found "{test}" on row {str(i)}: {out_text}')
