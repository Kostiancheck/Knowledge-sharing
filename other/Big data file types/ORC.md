#orc #hadoop #file_type 
**Apache ORC** (Optimized Row Columnar) is a free and open-source column-oriented data storage format. It is similar to the other columnar-storage file formats available in the Hadoop ecosystem such as RCFile and Parquet. The idea of creating was to speed up Apache Hive and reduce file sizes.  

It is optimized for large streaming reads, but with integrated support for finding required rows quickly. Storing data in a columnar format lets the reader read, decompress, and process only the values that are required for the current query. Because ORC files are type-aware, the writer chooses the most appropriate encoding for the type and builds an internal index as the file is written. Predicate pushdown uses those indexes to determine which stripes (roughly 64MB by default) in a file need to be read for a particular query.


ORC supports ACID transactions, but they are not designed to support OLTP requirements. It can support millions of rows updated per a transaction, but it can not support millions of transactions an hour. For more info about ACID and transactions in ORC check https://orc.apache.org/docs/acid.html, but in general I can say that ORC writes "transactions" into separate files and merge into "main" files after some number of transactions accumulated.

### Indexes
ORC provides three level of indexes within each file:
- file level - statistics about the values in each column across the entire file
- stripe level - statistics about the values in each column for each stripe
- row level - statistics about the values in each column for each set of 10,000 rows within a stripe

**The file and stripe level column statistics are in the file footer** so that they are easy to access to determine if the rest of the file needs to be read at all. Row level indexes include both the column statistics for each row group and the position for seeking to the start of the row group.

About Column Statistics. For each column, the writer records the count and depending on the type other useful fields. For most of the primitive types, it records the minimum and maximum values; and for numeric types it additionally stores the `sum` (for string it's the `sum` of the lengths), for booleans, the statistics include the count of false and true values, etc.
From Hive 1.1.0 onwards, the column statistics will also record if there are any null values within the row group by setting the `hasNull` flag, it can be useful for `IS NULL` queries.

The indexes at all levels are used by the reader using Search ARGuments or SARGs, which are simplified expressions that restrict the rows that are of interest. For example, if a query was looking for people older than 100 years old, the SARG would be “age > 100” and only files, stripes, or row groups that had people over 100 years old would be read.

### Data types
ORC provides a rich set of scalar and compound types:
- Integer
    - boolean (1 bit)
    - tinyint (8 bit)
    - smallint (16 bit)
    - int (32 bit)
    - bigint (64 bit)
- Floating point
    - float
    - double
- String types
    - string
    - char
    - varchar
- Binary blobs
    - binary
- Decimal type
    - decimal
- Date/time
    - timestamp
    - timestamp with local time zone
    - date
- Compound types
    - struct
    - list
    - map
    - union

### File Format
The metadata for ORC is stored using Protocol Buffers. The sections of the file tail are (and their protobuf message type):
- encrypted stripe statistics: list of ColumnarStripeStatistics
- stripe statistics: Metadata
- footer: Footer
	- The Footer section contains the layout of the body of the file, the type schema information, the number of rows, and the statistics about each of the columns.
- postscript: PostScript
	- The Postscript section provides the necessary information to interpret the rest of the file including the length of the file’s Footer and Metadata sections, the version of the file, and the kind of general compression used (eg. none, zlib, or snappy)
- psLen: byte

The process of reading an ORC file works backwards through the file. Rather than making multiple short reads, the ORC reader reads the last 16k bytes of the file with the hope that it will contain both the Footer and Postscript sections. The final byte of the file contains the serialized length of the Postscript, which must be less than 256 bytes. Once the Postscript is parsed, the compressed serialized length of the Footer is known and it can be decompressed and parsed.

As I said before the file and stripe level column statistics are in the file footer. Also at the end of the file a **postscript** holds compression parameters and the size of the compressed footer. The file footer contains a list of stripes in the file, the number of rows per stripe, and each column's data type. It also contains column-level aggregates count, min, max, and sum [3].
![[ORC file structure.png]]
**Index data** includes min and max values for each column and the row positions within each column. (A bit field or bloom filter could also be included.) Row index entries provide offsets that enable seeking to the right compression block and byte within a decompressed block.  Note that ORC indexes are used only for the selection of stripes and row groups and not for answering queries.

Having relatively frequent row index entries enables row-skipping within a stripe for rapid reads, despite large stripe sizes. By default every 10,000 rows can be skipped.

With the ability to skip large sets of rows based on filter predicates, you can sort a table on its secondary keys to achieve a big reduction in execution time. For example, if the primary partition is transaction date, the table can be sorted on state, zip code, and last name. Then looking for records in one state will skip the records of all other states.

### Compression
If the ORC file writer selects a generic compression codec (zlib or snappy), every part of the ORC file except for the Postscript is compressed with that codec. However, one of the requirements for ORC is that the reader be able to skip over compressed bytes without decompressing the entire stream. To manage this, ORC writes compressed streams in chunks with headers as in the figure below. To handle uncompressable data, if the compressed data is larger than the original, the original is stored and the isOriginal flag is set.
![[ORC compression.png]]
There are multiple techniques used for encoding, but let's skip them for now. You can find them in [5]


### Sources
1. https://orc.apache.org/docs/types.html - main ORC page
3. https://en.wikipedia.org/wiki/Apache_ORC - wiki
4. https://cwiki.apache.org/confluence/display/hive/languagemanual+orc - Hive documentation for ORC
5. https://orc.apache.org/specification/ORCv1/ - **ORC v1 specification** with information about file structure and encryption. The main document you need for deeper dive into ORC