import json
import os

import meilisearch


# for filtering documents
ml_categories = ["cs.AI", "cs.LG", "cs.MA"]
ml_keywords = [
    "machine learning",
    "artificial intelligence",
]

client = meilisearch.Client(
    "http://localhost:7700", os.environ.get("meilisearch_master_key")
)

with open("arxiv-metadata-oai-snapshot.json", "r") as f:
    k = 0

    def extract_text_fields(line):
        data = json.loads(line)
        out = {
            "id": data["id"].replace(".", "-"),
            "authors": data["authors"],
            "title": data["title"],
            "abstract": data["abstract"],
        }
        return out

    chunk = [extract_text_fields(next(f)) for _ in range(10000)]
    client.index("papers").add_documents(chunk)
    print(f"Chunk {k} added")

    file_read_over = False
    while not file_read_over:
        k += 1
        chunk = []
        for _ in range(10000):
            try:
                chunk.append(extract_text_fields(next(f)))
            except StopIteration:
                file_read_over = True
                break
        if len(chunk) > 0:
            client.index("papers").add_documents(chunk)
            print(f"Chunk {k} added")
