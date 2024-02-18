import pandas as pd
from tabulate import tabulate

if __name__ == '__main__':
    df = pd.read_csv("./dict.csv")
    df.info()
    print(df.describe())
    print(tabulate(df.head(20), headers='keys', tablefmt='psql'))
    print("=" * 50)
    print("Number of unique words in df", df['Word'].nunique())
    for word in df['Word'].unique()[:500]:
        print(word)
