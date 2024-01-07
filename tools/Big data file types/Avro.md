#avro #hadoop #file_type 
Apache Avro is  language-neutral row-oriented data serialization framework.
Avro relies on schemas. When Avro data is read, the schema used, when writing it is always present. Avro schemas are defined with JSON.
You can choose to use a different schema for reading the data back (the reader’s schema) from the one we used to write it (the writer’s schema). This is a powerful tool because it enables schema evolution. For example, you can provide schema to read with some additional field that maybe didn't exist in data, set default value for the field and you will get this field on-read. Or you can provide on-read schema with subset of fields you need, so it will skip fields that you don't interested in.

### Data types
Primitive types
- _null_: no value
- _boolean_: a binary value
- _int_: 32-bit signed integer
- _long_: 64-bit signed integer
- _float_: single precision (32-bit) IEEE 754 floating-point number
- _double_: double precision (64-bit) IEEE 754 floating-point number
- _bytes_: sequence of 8-bit unsigned bytes
- _string_: unicode character sequence 

Avro supports six kinds of complex types: 
- _records_ collection of named fields of any type
- _enums_ 
- _arrays_ 
- _maps_ 
- _unions_  union of schema, example, `["null", "string"]` declares a schema which may be either a null or string
- _fixed_

It also supports some logical types like _UUID_, _Duration_, _Decimal_, _Date_, and multiple _Timestamp_ types (milliseconds, local/UTC, etc)


### File Format
Avro’s object container file format is for storing sequences of Avro objects. A datafile has a header containing metadata, including the Avro schema and a sync marker, followed by a series of (optionally compressed) blocks containing the serialized Avro objects. Blocks are separated by a sync marker that is unique to the file (the marker for a particular file is found in the header) and that permits rapid resynchronization with a block boundary after seeking to an arbitrary point in the file, such as an HDFS block boundary. Thus, Avro datafiles are splittable, which makes them amenable to efficient MapReduce processing.

Avro includes a simple object container file format. A file has a schema, and all objects stored in the file must be written according to that schema, using binary encoding. Objects are stored in blocks that may be compressed. Syncronization markers are used between blocks to permit efficient splitting of files for MapReduce processing.

A file consists of:
- A file header, followed by
- one or more file data blocks.

A file header consists of:
- Four bytes, ASCII ‘O’, ‘b’, ‘j’, followed by 1.
- file metadata, including the schema.
- The 16-byte, randomly-generated sync marker for this file.

A file data block consists of:
- A long indicating the count of objects in this block.
- A long indicating the size in bytes of the serialized objects in the current block, after any codec is applied
- The serialized objects. If a codec is specified, this is compressed by that codec.
- The file’s 16-byte sync marker.
![[Avro file structure.png]]

### Encoding
Avro specifies two serialization encodings: binary and JSON. Most applications will use the binary encoding, as it is smaller and faster. But, for debugging and web-based applications, the JSON encoding may sometimes be appropriate.



### Sources
1. https://avro.apache.org/docs/1.11.1/ - main web site
2. https://en.wikipedia.org/wiki/Apache_Avro - wiki
3. https://www.youtube.com/watch?v=SZX9DM_gyOE&ab_channel=StephaneMaarek - short video about avro
4. [[Hadoop The Definitive Guide, 4th Edition.pdf]] chapter 12
5. https://avro.apache.org/docs/1.11.1/specification/ - Avro specification