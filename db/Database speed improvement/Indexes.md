# What is index
**Database index** is a [data structure](https://en.wikipedia.org/wiki/Data_structure "Data structure") that improves the speed of data retrieval operations on a [database table](https://en.wikipedia.org/wiki/Table_(database) "Table (database)") at the cost of additional writes and storage space to maintain the index data structure. Indexes are used to quickly locate data without having to search every row (full table scan) in a database table every time [^1]
# Why do we need them
When data is stored on disk-based storage devices, it is stored as blocks of data. These blocks are accessed in their entirety, making them the atomic disk access operation. Disk blocks are structured in much the same way as linked lists; both contain a section for data, a pointer to the location of the next node (or block), and both need not be stored contiguously.

Due to the fact that a number of records can only be sorted on one field, we can state that searching on a field that isn’t sorted requires a Linear Search which requires `(N+1)/2` block accesses (on average), where `N` is the number of blocks that the table spans. If that field is a non-key field (i.e. doesn’t contain unique entries) then the entire tablespace must be searched at `N` block accesses.

Whereas with a sorted field, a Binary Search may be used, which has `log2 N` block accesses. Also since the data is sorted given a non-key field, the rest of the table doesn’t need to be searched for duplicate values, once a higher value is found. Thus the performance increase is substantial. [^2]
# What types of indexes exists
Different databases can implement different types of indexes. The main difference - data structure that used to store index. It can be Binary Tree (the main one), Hash Tables etc.
PostgreSQL provides several index types
* B-Tree
* Hash
* GiST
* SP-GiST
* GIN
* BRIN [^3]

# How do they work
## Simple explanation
Classic example **"Index in Books"**
Consider a "Book" of 1000 pages, divided by 10 Chapters, each section with 100 pages.
Simple, huh?

Now, imagine you want to find a particular Chapter that contains a word "**Alchemist**". Without an index page, you have no other option than scanning through the entire book/Chapters. i.e: 1000 pages.

This analogy is known as **"Full Table Scan"** in database world.
But with an index page, you know where to go! And more, to lookup any particular Chapter that matters, you just need to look over the index page, again and again, every time. After finding the matching index you can efficiently jump to that chapter by skipping the rest. [^2]

## TODO Dive deeper
Index is some database structure that contains values of column or columns and pointer to specific database record. So as the first step we looking for the value in index and after that we take the pointer and go to the disk to get entire record (nit just columns that were indexed)


# Examples
Let's create the next table (all required code you can find in Knowledge-sharing repo)
```sql
CREATE TABLE IF NOT EXISTS person (  
id int,  
first_name varchar(255),  
last_name varchar(255),  
gender varchar(1),  
birthday DATE  
);
```
and insert 40 000 000 rows . This table has
* 695 unique `first_name`s
* 8736 unique `birthday`s

If we run query as is
```sql
explain analyze select * from person where id=874;
```
it takes around 1200 ms. Now let's make `id` a primary key, because by default DB creates index on primary keys. Now execution time is 0.045 ms **!!!** 

Now let's create 2 indexes and compare them on 3 different queries. These two indexes use the same 2 columns - birthday and name, but the order is different

```sql
With no Indexes

Queries
explain analyze select * from person where first_name='Angela' and birthday = '1980-04-13';
Parallel Seq Scan. Execution Time: 3487 ms

explain analyze select * from person where first_name='Angela' and birthday between '1980-02-13' and '2000-02-13';
Parallel Seq Scan. Execution Time: 1855.504 ms


explain analyze select * from person where starts_with(first_name, 'An') and birthday = '1980-04-13';
Parallel Seq Scan. Execution Time: 3071.640 ms
```

```sql
Index 1
create index person_first_name_birthday on person(first_name, birthday);

Queries
explain analyze select * from person where first_name='Angela' and birthday = '1980-04-13';
Index Scan. Execution Time: 0.765 ms

explain analyze select * from person where first_name='Angela' and birthday between '1980-02-13' and '2000-02-13';
Bitmap Index Scan. Execution Time: 1213.717 ms


explain analyze select * from person where starts_with(first_name, 'An') and birthday = '1980-04-13';
Parallel Seq Scan. Execution Time: 3219.044 ms
```

Probably last query takes too long because starts_with or LIKE operations are heavy enough. More about that you can find in [[Indexes#LIKE sucks]]

Now let's drop previous index and create second one with swapped order
```sql
Index 2
create index person_birthday_first_name on person(birthday, first_name);

Queries
explain analyze select * from person where first_name='Angela' and birthday = '1980-04-13';
Index Scan. Execution Time: 0.150 ms

explain analyze select * from person where first_name='Angela' and birthday between '1980-02-13' and '2000-02-13';
Parallel Seq Scan. Execution Time: 1967.308 ms


explain analyze select * from person where starts_with(first_name, 'An') and birthday = '1980-04-13';
Bitmap Index Scan. Execution Time: 20.214 ms
```
As you can when you check for absolute equation for both fields (query 1) order of columns is not SO important. But it's still better to index multiple columns in order from high cardinality to less. This means: first index the columns with more distinct values, followed by columns with fewer distinct values. [^4]

But if you have query where one column is equal but another one is some range (queries 2 and 3) you need to put first column on the first place in index. You can see that query 3 works faster when we have birthday first then when goes first in index.[^5]

# How to check index
To read data from index run the next queries:
```sql
CREATE EXTENSION pageinspect;

SELECT * FROM bt_metap('person_first_name_birthday'); 
# in output you will see column 'root' with id of the root node

select * from bt_page_stats('person_first_name_birthday', 42428);
# in output you will see column 'type' with r (root), l (leaf) or i (item) 

SELECT itemoffset, ctid, itemlen, nulls, vars, data, dead, htid, tids[0:2] AS some_tids, encode(decode(data,'hex'),'escape') as ass
        FROM bt_page_items('person_first_name_birthday', 42428);
# in output you will see ctid column where the first number is page id. You can use this id for further queries 
```

Where `person_first_name_birthday` - it's index name and `42428` it's page id (you should start with root id)

# LIKE sucks
```sql
explain analyze select * from person where first_name > 'An' and first_name < 'Ao' and birthday = '1980-04-13';
Index Scan. Execution Time: 90.549 ms

explain analyze select * from person where first_name LIKE 'An%' and birthday = '1980-04-13';
Parallel Seq Scan. Execution Time: 1739.075 ms

```
As you can see `LIKE` (and `starts_with` also) sucks 🤷‍♂️

# Different scans [^6]
As you can see in example above there are multiple scans is used for different cases. Even if you do have indexes Postgres can decide to not to use them and go with another Scan scenario.
* **Index Scan** scan obviously uses just index. Will be used when you need to specific rows (or small set of rows)
* **Seq Scan** ignores indexes and reads entire table. Will be used when you need a lot of data from table
* **BitMap** it's kind of combination of both - it reads data from indexes, combines data from index's leafs into the list and after that scans the table using that list. Will be used when you need SOME data from table (not enough for Seq but too little for Index)




[^1]: https://en.wikipedia.org/wiki/Database_index - wiki
[^2]: https://stackoverflow.com/questions/1108/how-does-database-indexing-work - nice stack overflow answers about indexes
[^3]: https://www.postgresql.org/docs/current/indexes.html PostgreSQL Indexes doc
[^4]: https://stackoverflow.com/questions/687986/what-are-some-best-practices-and-rules-of-thumb-for-creating-database-indexes - "rules of thumb" for creating database indexes? 
[^5]: https://stackoverflow.com/questions/24315151/does-order-of-fields-of-multi-column-index-in-mysql-matter/24315527#24315527 - Stack Overflow if index order matters
[^6]: https://www.cybertec-postgresql.com/en/postgresql-indexing-index-scan-vs-bitmap-scan-vs-sequential-scan-basics/?gclid=CjwKCAjw_uGmBhBREiwAeOfsd3IGT0cDyx72I8M8L4HNffkIG59vEMntL0N3Dn2ycoqmg16Zg8NldhoCTRAQAvD_BwE - INDEX SCAN VS. BITMAP SCAN VS. SEQUENTIAL SCAN (BASICS)