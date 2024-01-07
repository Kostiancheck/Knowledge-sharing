#parquet #file_type #hadoop
Apache Parquet is a free and open-source column-oriented data storage format in the Apache Hadoop ecosystem.

A key strength of Parquet is its ability to store data that has a deeply nested structure in
true columnar fashion. This is important since schemas with several levels of nesting are
common in real-world systems. Parquet uses a novel technique for storing nested
structures in a flat columnar format with little overhead, which was introduced by Google
engineers in the Dremel paper [2].The result is that even nested fields can be read
independently of other fields, resulting in significant performance improvements.

Parquet features:
- ***Dictionary encoding*** Parquet has an automatic dictionary encoding enabled dynamically for data with a _small_ number of unique values (i.e. below 10^5) that enables significant compression and boosts processing speed
- ***Bit packing*** Storage of integers is usually done with dedicated 32 or 64 bits per integer. For small integers, packing multiple integers into the same space makes storage more efficient
- ***Run-length encoding (RLE)*** To optimize storage of multiple occurrences of the same value, a single value is stored once along with the number of occurrences
- Parquet implements a hybrid of bit packing and RLE, in which the encoding switches based on which produces the best compression results. For Nested Encoding only RLE is now used as it supersedes BITPACKED
- It has improved read performance but slower writes. Reading a Parquet file is simpler than writing one, since the schema does not need to be specified as it is stored in the Parquet file.
- the schema can be modified according to the changes in the data
- it also provides the ability to add new columns and merge schemas that do not conflict
- can store nested data

### Data Model
The data stored in a Parquet file is described by a schema. Each field has a repetition (required, optional, or repeated), a type, and a name.
Schema example:
```
message WeatherRecord {
	required int32 year;
	required int32 temperature;
	required binary stationId (UTF8);
}
```

Primitive types:
- **boolean** Binary value
- **int32** 32-bit signed integer
- **int64** 64-bit signed integer
- **int96** 96-bit signed integer
- **float** Single-precision (32-bit) IEEE 754 floating-point number
- **double** Double-precision (64-bit) IEEE 754 floating-point number
- **binary** Sequence of 8-bit unsigned bytes
- **fixed_len_byte_array** Fixed number of 8-bit unsigned bytes

*NULL* is encoded in the definition levels (which is run-length encoded). NULL values are not encoded in the data. For example, in a non-nested schema, a column with 1000 NULLs would be encoded with run-length encoding (0, 1000 times) for the definition levels and nothing else.
Notice that there is no primitive string type. Instead, Parquet defines **logical types** that
specify how **primitive** types should be interpreted, so there is a separation between the
serialized representation (the primitive type) and the semantics that are specific to the
application (the logical type). Examples of logical types (you can find all logical types in [5]):
```
required binary stationId (UTF8); 
required int32 a (DATE);
message m {
	required groupa (LIST) {
		repeated group list {
			required int32 element;
		}
	}
}
```
Complex types in Parquet are created using the group type, which adds a layer of nesting. Parquet uses the encoding from Dremel [2] (highly recommend checking this paper, there are some good examples and better explanations), where every primitive type field in the schema is stored in a separate column, and for each value written, the structure is encoded by means of two integers: the definition level and the repetition level. 
In column-oriented files when we have nested column and value is Null we cannot say if current element is null or it's "parent"
```
Person:
	Name: Kostia
	Age: 1
Person:
	Age: 2
```
In that case Column Person. Name = [Kostia, NULL] but we cannot say if there is a NULL because there is no Name in Person 2, or if there is no Person 2 at all. That's why we need definition and repetition levels.
*Definition levels* specify how many optional fields in the path for the column are defined aka the level of nesting . *Repetition levels* specify at what repeated field in the path has the value repeated. The max definition and repetition levels can be computed from the schema (i.e. how much nesting there is). This defines the maximum number of bits required to store the levels (levels are defined for all values in the column). 
You can think of storing definition and repetition levels like this as a generalization of using a bit field to encode nulls for a flat record, where the non-null values are written one after another. The upshot of this encoding is that any column (even nested ones) can be read independently of the others. In the case of a Parquet map, for example, the keys can be read without accessing any of the values, which can result in significant performance improvements, especially if the values are large (such as nested records with many fields).

### File Format
A Parquet file consists of a header followed by one or more blocks, terminated by a footer. The header contains only a 4-byte magic number, PAR1, that identifies the file as being in Parquet format, and all the file metadata is stored in the footer. The footer’s metadata includes the format version, the schema, any extra key-value pairs, and metadata for every block in the file.
```
4-byte magic number "PAR1"
<Column 1 Chunk 1 + Column Metadata>
<Column 2 Chunk 1 + Column Metadata>
...
<Column N Chunk 1 + Column Metadata>
<Column 1 Chunk 2 + Column Metadata>
<Column 2 Chunk 2 + Column Metadata>
...
<Column N Chunk 2 + Column Metadata>
...
<Column 1 Chunk M + Column Metadata>
<Column 2 Chunk M + Column Metadata>
...
<Column N Chunk M + Column Metadata>
File Metadata
4-byte length in bytes of file metadata
4-byte magic number "PAR1"
```
In the above example, there are N columns in this table, split into M row groups. The metadata is written after all the blocks have been written, so the writer can retain the block boundary positions in memory until the file is closed, and there is no need to for specific markers to split blocks. To read Parquet we go to the end of the file minus 8 bytes to get the length of the metadata, after that we go backward by that length to read in metadata. When metadata is known we can find all the column chunks we are interested in. The columns chunks should then be read sequentially.

Each block in a Parquet file stores a row group, which is made up of column chunks
containing the column data for those rows. The data for each column chunk is written in
pages. Each page contains values from the same column, making a page a very good candidate for compression since the values are likely to be similar.
![[Structure of Parquet file.png]]

When writing files, Parquet will choose an appropriate encoding automatically, based on
the column type and number of unique values. Used encoding is stored in the file metadata to ensure that readers use the correct encoding.

### Metadata
Parquet contains next metada:
1. File Metadata:
    
    - File format version: Indicates the version of the Parquet file format used.
    - Schema: Defines the structure of the data stored in the file, including column names, data types, and any nested structures.
    - Compression codec: Specifies the compression algorithm used for compressing the column data.
    - Created by: Indicates the tool or library that created the Parquet file.
    - Other file-level properties: Additional metadata properties specific to the Parquet file.
2. Row Group Metadata:
    
    - Row group information: Each row group contains a subset of the data and represents an independent chunk that can be processed separately. The metadata for each row group includes the starting and ending positions of the row group within the file.
    - Column chunk information: Each row group contains one or more column chunks that store the actual data for individual columns. The metadata for each column chunk includes details such as the column's name, data type, encoding method, and compression codec used.
3. Column Chunk Metadata:
    
    - Encoding: Specifies the encoding technique used to encode the column data, such as dictionary encoding, plain encoding, or bit-packing.
    - Compression codec: Indicates the compression algorithm applied to compress the column data within the chunk.
    - Statistics: Optional statistics for the column, such as minimum and maximum values, number of nulls, or other summary information. These statistics can be used for query optimization and data analysis.
    - Data page offsets: Stores the offsets of individual data pages within the column chunk. Each data page contains a portion of the column's encoded data.
    - Other properties: Additional metadata properties specific to the column chunk.
![[Parquet metadata.png]]
![[Parquet metadata detailed.png]]

### Sources and useful links
1. https://parquet.apache.org/docs/ - Parquet web site
2. https://static.googleusercontent.com/media/research.google.com/en//pubs/archive/36632.pdf - Dremel paper
3. [[Hadoop The Definitive Guide, 4th Edition.pdf]]
4. https://github.com/julienledem/redelm/wiki/The-striping-and-assembly-algorithms-from-the-Dremel-paper - Dremel schema exmplanation
5. https://github.com/apache/parquet-format/blob/master/LogicalTypes.md - Logical types in parquet
6. https://en.wikipedia.org/wiki/Apache_Parquet - wikipedia
7. https://pypi.org/project/parquet-tools/ - cli tool to interact with parquet files (show, show schema, etc)
8. https://www.youtube.com/watch?v=PaDUxrI6ThA&ab_channel=RizAng - video with size comparison to CSV and different compressions (gzip, snappy, etc)