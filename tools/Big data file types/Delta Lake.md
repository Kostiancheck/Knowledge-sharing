## Why Delta Lake?

Traditional data lakes store raw files (Parquet, CSV, JSON) in object storage (S3, GCS, etc). This is cheap and scalable, but it comes with fundamental reliability problems that make them hard to use as the foundation of production data pipelines.

### Problems with vanilla data lakes

| Problem                              | Description                                                                                                          |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| **No ACID transactions**             | Two concurrent writers can corrupt a table. A failed write leaves partial data behind.                               |
| **No schema enforcement**            | Nothing stops a bad write from adding a new column or changing a type, silently breaking downstream consumers.       |
| **No time travel**                   | Once you overwrite data, it's gone. Auditing and reproducibility are impossible.                                     |
| **Expensive updates/deletes**        | Updates and deletes require rewriting entire Parquet files.                                                          |
| **Slow metadata operations**         | Listing millions of S3 objects to discover partition files is slow and expensive (`s3:ListObjects` costs money too). |
| **No streaming + batch unification** | Streaming writes create small files; batch reads need large files. Reconciling the two is painful.                   |

Delta Lake was created at Databricks (open-sourced in 2019, donated to Linux Foundation in 2021) to solve exactly these problems by adding a **transaction log** on top of Parquet files in object storage.

> "Delta Lake is an open-source storage framework that enables building a Lakehouse architecture." — [delta.io](https://delta.io)

## Architecture: How Delta Lake Works Under the Hood

### The Core Idea: The Transaction Log (`_delta_log/`)

Every Delta table is a directory containing:
1. **Parquet data files** — the actual data, immutable once written
2. **`_delta_log/`** — a directory of JSON commit files (and periodic Parquet checkpoints)

```
my_table/
├── _delta_log/
│   ├── 00000000000000000000.json   ← commit 0 (table creation)
│   ├── 00000000000000000001.json   ← commit 1 (first write)
│   ├── 00000000000000000002.json   ← commit 2 (update)
│   ├── 00000000000000000009.checkpoint.parquet  ← snapshot at version 9
│   └── _last_checkpoint             ← pointer to latest checkpoint
├── part-00000-abc123.snappy.parquet
├── part-00001-def456.snappy.parquet
└── ...
```

The transaction log is a **write-ahead log (WAL)**. Every operation that changes the table appends a new JSON file to `_delta_log/`. To know the current state of a table, you replay all commits from the last checkpoint forward.

### Anatomy of a Commit File

Each commit JSON contains **actions** — a newline-delimited JSON (JSONL) stream:

```json
{"commitInfo": {"timestamp": 1700000000000, "operation": "WRITE", "operationParameters": {"mode": "Append"}}}
{"add": {"path": "part-00000-abc123.snappy.parquet", "size": 102400, "partitionValues": {"date": "2024-01-01"}, "dataChange": true, "stats": "{\"numRecords\":5000,\"minValues\":{\"id\":1},\"maxValues\":{\"id\":5000}}"}}
```

Action types:
- **`add`** — a new data file is part of the table
- **`remove`** — a file is logically deleted (tombstoned), actual file stays until `VACUUM`
- **`metaData`** — schema changes, partition column changes
- **`protocol`** — minimum reader/writer version requirements
- **`commitInfo`** — audit metadata (who, when, what operation)
- **`txn`** — idempotency token for streaming exactly-once semantics

A commit for a 1-row write looks like this:

```
00000000000000000003.json  ← ~500 bytes of JSON metadata
part-00000-a1b2c3.snappy.parquet  ← contains the actual 1 row (~5 KB with Parquet overhead)
```

So the question "what if there is only 1 row?" actually has two sub-problems:

**Problem 1: The small Parquet data file**
Parquet has significant per-file overhead (schema, row group metadata, footer). A 1-row Parquet file might be 5–50 KB. If you write 10,000 1-row micro-batches, you get 10,000 tiny Parquet files. Reading the table now requires opening 10,000 files — slow, and expensive on object storage (each file = an HTTP request).

**Problem 2: The many commit JSON files**
10,000 commits = 10,000 JSON files in `_delta_log/`. Reconstructing the current table state requires reading all of them (or the last checkpoint + commits since). This slows down cold reads.

#### How `OPTIMIZE` / Compact Solves This

`OPTIMIZE` (compact mode) reads all small Parquet data files, merges their rows, and writes new larger Parquet files — targeting a default size of 1 GB per file. It then records the result as a single new commit:

```
Before OPTIMIZE:
  10,000 × part-xxxxx.snappy.parquet   (5 KB each = 50 MB total)
  10,000 × _delta_log/000NNN.json

OPTIMIZE runs → one new commit:
  _delta_log/00010001.json   ← adds 1 big file, removes 10,000 small files
  part-00000-merged.snappy.parquet   (50 MB, one file)

The 10,000 old Parquet files are now tombstoned (remove actions).
They stay on disk until VACUUM cleans them up.
```

The commit JSON files themselves are never compacted — they accumulate forever in `_delta_log/`. This is why **checkpoints** exist: every 10 commits (in Spark Delta; manually in delta-rs), a Parquet snapshot of the entire log state is written, allowing readers to skip all prior JSON files.

```
_delta_log/
├── 00000000000000000000.json   ┐
├── 00000000000000000001.json   │  skipped — captured in checkpoint
├── ...                         │
├── 00000000000000000009.json   ┘
├── 00000000000000000009.checkpoint.parquet  ← Parquet snapshot of full state
├── _last_checkpoint                         ← {"version": 9}
├── 00000000000000000010.json   ┐  replayed on top of checkpoint
└── 00000000000000000011.json   ┘
```

#### Practical guidance for high-frequency writes

| Write pattern | Problem | Solution |
|---|---|---|
| Streaming micro-batches (Kafka, etc.) | Thousands of small Parquet files | Run `OPTIMIZE compact` hourly/nightly |
| Many small appends from edge devices | Same | Batch-buffer before writing, or compact downstream |
| Frequent single-row UPDATEs | File rewrites per update | Enable **Deletion Vectors** — turns row-level deletes into a small bitmap, defer rewrite to `OPTIMIZE` |
| Long-running streaming job | Log file accumulation | Call `dt.create_checkpoint()` periodically (delta-rs) |

### Optimistic Concurrency Control (OCC)

Delta Lake uses **optimistic concurrency control** to handle concurrent writers without locks:

1. Writer reads the current table version `N`
2. Writer builds its transaction (new files to add/remove)
3. Writer attempts to atomically write commit `N+1.json`
4. If another writer already wrote `N+1.json`, the write fails
5. Delta checks if the conflict is **resolvable** (e.g., two writers appending to different partitions can both succeed via retry). If not, it raises a `ConcurrentModificationException`.

This is what makes Delta ACID-compliant on top of object storage, which itself only guarantees **put-if-absent** atomicity for a single object write. The key insight: writing a single small JSON file is the atomic "commit" operation.

### Checkpoints
#### What a checkpoint contains

A checkpoint is a Parquet file (or set of Parquet files for large tables) stored inside `_delta_log/`. It contains **the same information as the JSON commit files**, just in a more efficient format. Specifically it is the **materialized result of replaying all actions up to that version** — a deduplicated, current-state-only view of the log.

Think of it as the answer to: *"If I replayed all JSON commits from version 0 to version N, what would the final set of active `add` actions, `metaData`, and `protocol` look like?"*

The checkpoint stores rows like this (each row is one action, exactly one column is non-null per row):

| `add.path` | `add.size` | `add.stats` | `remove.path` | `remove.deletionTimestamp` | `metaData.schema` | ... |
|---|---|---|---|---|---|---|
| `part-0001.parquet` | 102400 | `{min:1,max:5000}` | null | null | null | |
| null | null | null | `part-0000.parquet` | `1700001000000` | null | |
| null | null | null | null | null | `{fields:[...]}` | |

- **`add` rows** — one row per currently active (non-tombstoned) Parquet file
- **`remove` rows** — one row per recently tombstoned file, **within the retention window** (default 7 days)
- **`metaData` row** — current schema, partition columns, table properties
- **`protocol` row** — min reader/writer versions
- **`txn` rows** — latest streaming transaction IDs (for exactly-once semantics)
- **No `commitInfo`** — audit history is not carried into the checkpoint

#### Why does the checkpoint include `remove` actions?

This surprises most people. If a checkpoint is the "current state", why record files that are no longer part of the table?

Two reasons:

**1. Time travel needs them.**
A reader asking for the table at version `V` (which is older than the checkpoint at version `N`) needs to reconstruct what was active at `V`. To do that it needs to know: *"which files were removed between V and N?"* — so it can add them back. Without `remove` rows in the checkpoint, the reader would have to scan all the way back through the JSON commit files to find those tombstones, defeating the purpose of the checkpoint entirely.

```
Time travel to version V (V < checkpoint N):
  Start from checkpoint N (has all current adds + recent removes)
  Walk backwards through removes: if remove.deletionTimestamp > V,
    that file was still active at V → re-add it to the file list
  Walk backwards through adds: if add was introduced after V → exclude it
```

**2. VACUUM needs them.**
VACUUM's job is to find files on disk that are tombstoned AND older than the retention threshold, then delete them. It gets the tombstone list from `remove` actions. If those were not in the checkpoint, VACUUM would need to replay the entire JSON commit history to build its delete list.

#### What the checkpoint does NOT contain

- **No row data** — the actual `part-xxxx.snappy.parquet` data files are entirely separate and untouched
- **Old `remove` rows (beyond retention window)** — once a tombstone is older than `deletedFileRetentionDuration` (default 7 days) and VACUUM has run, it is dropped from subsequent checkpoints. At that point time travel to versions that needed that file is no longer possible anyway.
- **`commitInfo`** — per-commit audit metadata lives only in the individual JSON files

#### The read path in detail

```
Cold read of table at version V
─────────────────────────────────────────────────────
1. Read _last_checkpoint
   → {"version": 50, "size": 4213, "parts": 1}

2. Read 00000000000000000050.checkpoint.parquet
   → get all active `add` actions, current schema, protocol
   → this is fast: one Parquet columnar read, predicate pushdown works

3. Read JSON commits 51.json, 52.json, ..., V.json
   → apply any new add/remove/metaData actions on top of the checkpoint state
   → only a handful of small files instead of thousands

4. Build the file list for the scan
   → send to the Parquet reader
```

Compare this to a table with 10,000 commits and no checkpoint: the reader must open and parse 10,000 JSON files serially before it can even start reading data. With a checkpoint every 10 commits, that becomes at most 1 Parquet file + 9 JSON files.

#### Multi-part checkpoints

For very large tables with millions of active files, a single checkpoint Parquet file can itself become unwieldy. Delta supports **multi-part checkpoints** — the checkpoint is split across several Parquet files that can be read in parallel:

```
_delta_log/
├── 00000000000000000090.checkpoint.0000000001.0000000003.parquet
├── 00000000000000000090.checkpoint.0000000002.0000000003.parquet
├── 00000000000000000090.checkpoint.0000000003.0000000003.parquet
└── _last_checkpoint  →  {"version": 90, "parts": 3}
```

#### V2 Checkpoints (Delta 3.0+)

Delta 3.0 introduced a new checkpoint format that adds a `sidecar` mechanism: instead of putting all `add` actions directly into the checkpoint Parquet file, they are stored in separate sidecar files. This allows checkpoint metadata to be updated cheaply without rewriting the entire (potentially huge) `add` action list.

### Data Skipping and File-Level Statistics

Every `add` action in the log stores **column statistics** for that Parquet file:
- `numRecords`
- `minValues` per column
- `maxValues` per column
- `nullCount` per column

At query time, Delta evaluates your `WHERE` clause against these stats to **skip files** that provably contain no matching rows, without opening the Parquet files themselves. This is the primary performance mechanism for point queries and range scans.

```
SELECT * FROM orders WHERE order_id = 42
→ Check stats: which files have minValues.order_id ≤ 42 ≤ maxValues.order_id?
→ Read only those files
```

### Z-Ordering (Multi-Dimensional Clustering)

Standard Hive-style partitioning works well for a single low-cardinality column (e.g., `date`). The moment you need to filter on **two or more columns at once** (e.g., `customer_id AND product_id`), partitioning breaks down — you can only physically sort files by one dimension. Z-ordering solves this.

#### What Z-Order Actually Does

Z-ordering maps each row's multi-dimensional key into a **single 1-D value** using a **Z-curve** (also called a Morton code), then sorts rows by that value before writing Parquet files.
![[Pasted image 20260325231918.png | 400]]

The Z-curve interleaves the binary representations of each column value bit-by-bit:

```
customer_id = 5   →  binary: 101
product_id  = 6   →  binary: 110

Interleave bit-by-bit (customer, product, customer, product ...):
  1  1  0  1  0  0
  └──┴──┴──┴──┴──┘
  Z-value = 110100 = 52
```

The key property of the Z-curve: **values that are close in 2-D space are also close in 1-D Z-space** (most of the time). When you sort rows by Z-value and write them into Parquet files, rows that share similar `customer_id` AND `product_id` values end up in the same file. This dramatically tightens the `minValues`/`maxValues` per-file statistics that Delta stores in the transaction log, so **data skipping becomes effective on both columns at once**.

```
Before Z-Order:
  File 1: customer_id 1-1000, product_id 1-1000   ← too wide, can't skip
  File 2: customer_id 1-1000, product_id 1-1000   ← same

After Z-Order:
  File 1: customer_id 1-50,   product_id 1-50     ← tight, skip most queries
  File 2: customer_id 1-50,   product_id 51-100
  File 3: customer_id 51-100, product_id 1-50
  ...
```

A query `WHERE customer_id = 30 AND product_id = 75` now hits only File 2 instead of all files.

#### What Z-Order Does NOT Do

- It **does not repartition** the table in the Hive sense — no new directories are created
- It **does not help** if you filter on only one of the Z-order columns (partitioning is still better for single-column high-selectivity filters)
- It **does not persist** incrementally — every new batch of data written after Z-ordering is un-ordered again; you must re-run `OPTIMIZE ZORDER` periodically
- Z-order columns **cannot be partition columns** — the partition directory already handles that dimension

#### The Diminishing Returns Problem

Z-ordering is a full rewrite of all files in the table (or partition). On large tables this is expensive, and the benefit erodes with every new write. This is the core motivation for Liquid Clustering.

More about Z-Ordering [here](https://delta.io/blog/2023-06-03-delta-lake-z-order/)

### Time Travel

Because Delta never mutates or deletes data files immediately (only `remove` actions in the log), you can query any historical version:

- **By version number**: `version=5`
- **By timestamp**: `timestamp="2024-01-15T10:00:00"`

Files only become eligible for deletion after `VACUUM` is run with a retention threshold (default 7 days).

### Schema Evolution and Enforcement

- **Schema enforcement**: By default, writes that don't match the table schema fail. This prevents silent corruption.
- **Schema evolution**: With `schema_mode="merge"` (or `overwrite_schema=True`), new columns can be added automatically.
- The current schema is stored in the `metaData` action of the latest commit that changed the schema.

### Liquid Clustering (Delta 3.x+)

Liquid Clustering was introduced in Delta 3.0 (2023) to fix the two biggest operational problems with Z-ordering: it's expensive (full rewrite every time) and it degrades immediately after new data arrives. Liquid Clustering is **incremental** — only newly written or unclustered files are processed on each `OPTIMIZE` run.

#### How It Works Internally

Liquid Clustering replaces the Z-curve with a **Hilbert curve**, which has better locality properties — values that are adjacent in N-D space are more likely to be adjacent in 1-D Hilbert space than with a Z-curve. But the bigger architectural difference is how it tracks which files need clustering:
![[Pasted image 20260325233001.png]]

1. **Clustering columns are declared at table creation** (or altered later — this is free, no rewrite):
   ```sql
   CREATE TABLE orders
   CLUSTER BY (customer_id, order_date);
   ```
   Internally this writes a `clusteringColumns` field into the `metaData` action in the transaction log.

2. **Each new data file gets a `clusteringScore`** stored in its `add` action — a measure of how well its rows are sorted along the Hilbert curve for the declared clustering columns.

3. **`OPTIMIZE` is now incremental**: instead of rewriting every file, it reads the clustering scores from the transaction log and only rewrites files whose score is below a threshold. High-scoring (already well-clustered) files are left untouched. This means:
   - First `OPTIMIZE` after a big load: rewrites everything
   - Subsequent `OPTIMIZE` calls: only rewrites new files written since the last run
   - Cost is roughly proportional to the volume of new data, not total table size

1. **Queries use the same data-skipping mechanism** as Z-ordering — `minValues`/`maxValues` per file from the `add` actions. No changes needed at the reader layer.
### Deletion Vectors (Delta 2.3+)

A key optimization for `UPDATE` and `DELETE`: instead of rewriting an entire Parquet file to change one row, Delta writes a **deletion vector** — a small bitmap file that marks which rows in a data file are logically deleted.

This means:
- Deletes are near-instant (write a small bitmap, not rewrite GBs)
- The data file is reused for unchanged rows
- `OPTIMIZE` can later compact and materialize the deletions

# Summary

TL;DR Delta Lake is just a parquet files with corresponding metadata and "transactions" in form of json files in `_delta_log` folder.

## Sources and Further Reading
1. [Delta Lake Documentation](https://docs.delta.io/latest/index.html)
2. [Delta Lake GitHub](https://github.com/delta-io/delta/blob/master/PROTOCOL.md#per-file-statistics) with PROTOCOL specs
3. [[Delta_Lake_Up_and_Running.pdf]]
