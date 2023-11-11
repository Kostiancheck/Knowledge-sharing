import os
import meilisearch

client = meilisearch.Client('http://localhost:7700', os.environ.get("meilisearch_master_key"))

found = client.index('papers').search('')
print(found)
