---
banner: "![[Pasted image 20240208193912.png]]"
---
# Hash Table

## Simple example
Let's start with a simple example: you have a company with 20 employees, and you want to find specific one by ID. One way of doing this is to create array of 100 items and store an employee with ID `N` in position `N mod 100`. E.g. ID 2190 -> position 90, ID 2817 -> position 17. To find a particular employee, you would simply calculate the `ID mod 100` and look at the corresponding array entry. This is an `O(1)` operation. Congrats, we invented **hash table** (no yest' nuansiki)

Obvious downside of this example is that employees with IDs 13**37** and 73**37** will map to the same array element with index **37**. It calls [[Hash function and collisions#Collisions|collisions]]. Also in that example for 20 employees we allocated array with 100 elements. It's a little to much, isn't it?

## Hash table
Hash tables (also known as hash maps, maps, dictionaries, and associative arrays, these therms are not the same, but we can use them as synonyms) is a complex data structure that operates with **key-value** pairs. And we want to be able to get/delete/update/etc value by it's key and make it as fast and efficient as possible. 
A hash table is data structure that has some extra logic behind it. Arrays and lists map straight to memory, but hash tables are smarter. They use a [[Hash function and collisions|hash function]] to intelligently figure out where to store elements.  **So hash table can be created by combining a hash function with an [[Array]]** 

(switch to [[Hash function and collisions]])

A hash table’s **load factor** or **fill percentage**, the percentage of the table that contains entries, influences the chance of collisions occurring. Adding a new key to a hash table is more likely to cause a collision if the table’s data structure is 95 percent full than if the data structure is 10 percent full. A lower fill percentage gives better performance but requires extra space that isn’t used to hold data, so in some sense it is wasted. Too high a fill percentage can slow performance and increases the risk that the hash table will become full. This requires you to resize the hash table, which can take a considerable amount of time and memory. You can also have an algorithm for determining when and how to make the hash table smaller. One simple method of resizing a hash table is to create a new hash table of the desired size and rehash all the items in the original data structure into the new table. A good rule of thumb is, resize when your load factor is greater than *0.7*.

To be useful, a hash table must be able to at least 
* add new items
* locate items that were previously stored
* Another feature that is useful but not provided by some hash tables is the ability to remove a hashed key. 

**To summarise**, a hash table needs the following:
* A data structure to hold the data (Array)
* A hashing function to map keys to locations in the data structure
* A collision-resolution policy that specifies what should be done when keys collide
# Use cases
Take value by key and 1000000 situations when you would like to do this. Also you can use hash tables for deduplication.

Hash tables can be used to implement [caches](https://en.wikipedia.org/wiki/Cache_(computing) "Cache (computing)"), auxiliary data tables that are used to speed up the access to data that is primarily stored in slower media. In this application, hash collisions can be handled by discarding one of the two colliding entries—usually erasing the old item that is currently stored in the table and overwriting it with the new item, so every item in the table has a unique hash value
# Sources
1. Rod Stephens, Essential Algorithms, pages 169+ https://doc.lagout.org/science/0_Computer%20Science/2_Algorithms/Essential%20Algorithms_%20A%20Practical%20Approach%20to%20Computer%20Algorithms%20%5BStephens%202013-08-12%5D.pdf
2. Aditya Y. Bhargava, Grokking Algorithms, chapter 5 https://edu.anarcho-copy.org/Algorithm/grokking-algorithms-illustrated-programmers-curious.pdf
3. SUPER NICE Real Python article about how to build Hash Table in Python using TDD - https://realpython.com/python-hash-table/#examine-pythons-built-in-hash