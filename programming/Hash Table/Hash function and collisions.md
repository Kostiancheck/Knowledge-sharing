# Hash function
A hash function is a function where you put in some key as a sequence of bytes (in the simplest scenario is a string) and you get back a number.
There are some requirements for a hash function to use in [[Hash Table]]: 
* It needs to be consistent. For example, suppose you put in “apple” and get back “4”. Every time you put in “apple”, you should get “4” back. Without this, your hash table won’t work. 
* It should map different sequence of bytes to different numbers. For example, a hash function is no good if it always returns “1” for any word you put in. In the best case, every different word should map to a different number.
![[Pasted image 20240208213355.png]]

When we defined hash function we can build array and use these numbers as indexes

```python
hash = hashfunc(key)  
index = hash % array_size
```

In this method, the `hashfunc` is independent of the array size and it is then reduced to an index (a number between 0 and array_size − 1) by using the modulo operator (%). **All (or almost all) hash table realisations use mod to "normalize" index to fit within array size**

To achieve a good hashing mechanism, It is important to have a good hash function with the following basic requirements:

1. It should be easy to compute and must not become an algorithm in itself.
    
2. Uniform distribution: It should provide a uniform distribution across the hash table and should not result in clustering.
    
3. Less collisions: Collisions occur when pairs of elements are mapped to the same hash value. These should be avoided.

Let's look into 2 examples of hash functions:
1. `FNV1a` hash that was used in python until v3.4
2. `SipHash` that is in use right now

## FNV1a hash
**Fowler–Noll–Vo** (or **FNV**, named by second names of authors) is a [non-cryptographic hash function](https://en.wikipedia.org/wiki/Non-cryptographic_hash_function)  . One of FNV's key advantages is that it is very simple to implement. Start with an initial hash value of FNV offset basis. For each byte in the input, multiply hash by the FNV prime, then XOR it with the byte from the input. The alternate algorithm, FNV-1a, reverses the multiply and XOR steps. FNV currently comes in 32-, 64-, 128-, 256-, 512-, and 1024-bit variants

As an example, consider the 64-bit FNV-1 hash:
- All variables, except for `byte_of_data`, are 64-bit unsigned integers.
- The variable, `byte_of_data`, is an 8-bit unsigned integer.
- The `FNV_offset_basis` is the 64-bit FNV offset basis value: `14695981039346656037` (in hex, `0xcbf29ce484222325`).
- The `FNV_prime` is the 64-bit FNV prime value: `1099511628211` (in hex, `0x100000001b3`).
- The multiply returns the lower 64-bits of the product.
- The XOR is an 8-bit operation that modifies only the lower 8-bits of the hash value.
- The hash value returned is a 64-bit unsigned integer.
The FNV-1a hash differs from the FNV-1 hash by only the order in which the multiply and XOR is performed. The change in order leads to slightly better avalanche characteristics (if an input is changed slightly, the output changes significantly)

```python
# Pseudocode
algorithm fnv-1a is
    hash := FNV_offset_basis

    for each byte_of_data to be hashed do
        hash := hash XOR byte_of_data
        hash := hash × FNV_prime

    return hash 
```
Python:
```python
FNV1_64_INIT = 0xcbf29ce484222325  
FNV_64_PRIME = 0x100000001b3  
  
  
def fnva(data):  
    assert isinstance(data, bytes)  
    print("Hash input", data)  
    hval = FNV1_64_INIT  
    for i, byte in enumerate(data):  
        print(f"{i}) hval={hval}, hval ^ byte = {hval ^ byte}")  
        hval = hval ^ byte  
        hval = (hval * FNV_64_PRIME) % 2 ** 64  
    return hval  
  
  
print("=" * 5, "START", "=" * 5)  
print(fnva(b"bruh"))  
print("=" * 10)  
print(fnva(b"Mind uploading"))  
print("=" * 10)  
print(fnva(b"Knowledge sharing 1337$^&%@$(#)"))
```

Original implementation in C looks similar to logic above with some additional normalisation and stuff. 
## SipHash
Although SipHash is designed as a [non-cryptographic hash function](https://en.wikipedia.org/wiki/Non-cryptographic_hash_function) it provides the best combination of speed and security. That's why a lot of programming languages use it for hash table implementations. 
Attackers can manage to create hash collisions. This is called a [collision attack](https://en.wikipedia.org/wiki/Collision_attack). If an attacker can pull this off, they degrade performance and can potentially take down your web site or API. Thats why Python decided to use SipHash instead of less secure FNV1a. 
For more info about SipHash see Source 5

Due to the PEP 456 Python folds reference to Marek's Majkowski C implementation [csiphash](https://github.com/majek/csiphash/) . In Marek's repo u can also find  python implementation [pysiphash](https://github.com/majek/pysiphash)  (open, close, and never open again)
# Collisions
Collision is when two keys have been assigned the same slot. When that occurs, you need a collision-resolution policy that determines what to do.
![[Pasted image 20240212235554.png]]

There are many different ways to deal with collisions. To main classes of collisions resolutions are:
- *Separate Chaining* In separate chaining, additional data structure of objects that hash to each slot in the hash table is present. 
- *Open addressing* collisions are handled by looking for the following empty space in the table. If the first slot is already taken, the hash function is applied to the subsequent slots until one is left empty. There are various ways to use this approach, including double hashing, linear probing, and quadratic probing. Python dictionaries use a different approach called [open addressing](https://hg.python.org/cpython/file/52f68c95e025/Objects/dictobject.c#l296)


## Separate chaining (open hashing)

Separate chaining is one of the most commonly used collision resolution techniques. It is usually implemented using linked lists. In separate chaining, each element of the hash table is a linked list. To store an element in the hash table you must insert it into a specific linked list. If there is any collision (i.e. two different elements have same hash value) then store both the elements in the same linked list.
![[Pasted image 20240209185559.png]]

Data Structures For Storing Chains: 
+ Linked lists
+ Dynamic Sized Arrays
+ Self Balancing BST
+ Hash function with hash function with has function ........ with linked list ?

## Open addressing
In open addressing, instead of in linked lists, all entry records are stored in the array itself. When a new entry has to be inserted, the hash index of the hashed value is computed and then the array is examined (starting with the hashed index). If the slot at the hashed index is unoccupied, then the entry record is inserted in slot at the hashed index else it proceeds in some probe sequence until it finds an unoccupied slot.

### LinearProbing
For example, suppose the hash table’s array contains 100 items, and the hashing rule is: N maps to location N mod 100. Then the probe sequence for the value 2,197 would visit locations 97, 98, 99, 0, 1, 2, and so forth. Figure 8-2 shows a linear probe sequence for inserting the value 71

![[Pasted image 20240209190109.png]]
Here the table already contains several values when you want to add item 71. This table’s array has 10 entries, so 71 maps to location 71 mod 10 = 1. That location already contains the value 61, so the algorithm moves to the next location in the value’s probe sequence, location 2. That location is also occupied, so the algorithm moves to the next location in the probe sequence, location 3. That location is empty, so the algorithm places 71 there. 
This method has the advantages that it is very simple and that a probe sequence will eventually visit every location in the array. Therefore, the algorithm can insert an item if any space is left in the array. However, it has a disadvantage called **primary clustering**, an effect in which items added to the table tend to cluster to form large blocks of contiguous array entries that are all full. This is a problem because it leads to long probe sequences. If you try to add a new item that hashes to any of the entries in a cluster, the item’s probe sequence will not find an empty location for the item until it crosses the whole cluster. 


Another problem, suppose items A and B both map to the same index IA in the array. Item A is added first at index IA, so when you try to add item B, it goes to the second position in its probe sequence, IB. Now suppose you remove item A. If you then try to find item B, you initially look at index IA. Because that entry is now empty, you incorrectly conclude that item B isn’t present. 
![[Pasted image 20240213125912.png|500]]
One solution to this problem is to mark the item as deleted instead of resetting the array’s entry to the empty value. For example, if the array holds 32-bit integers, you might use the value –2,147,483,648 to mean that an entry has no value and –2,147,483,647 to mean that the value has been deleted. When you search for a value, you continue searching if you find the deleted value. When you insert a new value into the hash table, you can place it in a previously deleted entry if you find one in the probe sequence.

### Quadratic probing
The reason linear probing produces clusters is that items that map to any location in a cluster end up at the end of the cluster, making it larger. One way to prevent that is **quadratic probing**. Instead of adding a constant stride to locations to create a probe sequence, the algorithm adds the square of the number of locations it has tried to create the probe sequence
![[Pasted image 20240213130146.png]]
### Pseudorandom probing
Pseudorandom probing is similar to linear probing, except that the stride is given by a pseudorandom function of the initially mapped location. In other words, if a value initially maps to position K, its probe sequence is K, K + p, K + 2 * p, ..., where p is determined by a pseudorandom function of K. Like quadratic probing, pseudorandom probing prevents primary clustering. Also like quadratic probing, pseudorandom probing is subject to secondary clustering, because values that map to the same initial position follow the same probe sequences. Pseudorandom probing may also skip over some unused entries and fail to insert an item even though the table isn’t completely full.

### Double hashing
Double hashing is similar to pseudorandom probing. Instead of using a pseudorandom function of the initial location to create a stride value, it uses a second hashing function to map the original value to a stride. [[Hash function and collisions#Pseudorandom probing]] suppose the values A and B both initially map to position K. In pseudorandom probing, a pseudo-random function F1 generates a stride p = F1 (K). Then both values use the probe sequence K, K + p, K + 2 * p, K + 3 * p, ... . In contrast, double hashing uses a pseudorandom hash function F2 to map the original values A and B to two different stride values pA = F2 (A) and pB = F2 (B). The two probe sequences start at the same value K, but after that they are different. Double hashing eliminates primary and secondary clustering. However, like pseudorandom probing, double hashing may skip some unused entries and fail to insert an item even though the table isn’t completely full.
# Sources
1. Rod Stephens, Essential Algorithms, pages 169+ https://doc.lagout.org/science/0_Computer%20Science/2_Algorithms/Essential%20Algorithms_%20A%20Practical%20Approach%20to%20Computer%20Algorithms%20%5BStephens%202013-08-12%5D.pdf
2. Aditya Y. Bhargava, Grokking Algorithms, chapter 5 https://edu.anarcho-copy.org/Algorithm/grokking-algorithms-illustrated-programmers-curious.pdf
3. What is Python's Default Hash Algorithm? https://andrewbrookins.com/technology/pythons-default-hash-algorithm/
4. PEP 456 – Secure and interchangeable hash algorithm - https://peps.python.org/pep-0456/#conclusion
5. SipHash Wiki - https://en.wikipedia.org/wiki/SipHash
6. Knuth Vol. 3, Sec. 6.4., Hashing - https://seriouscomputerist.atariverse.com/media/pdf/book/Art%20of%20Computer%20Programming%20-%20Volume%203%20(Sorting%20&%20Searching).pdf
7. FNV wiki - https://en.wikipedia.org/wiki/Fowler%E2%80%93Noll%E2%80%93Vo_hash_function#FNV_prime
8. Parameters of the FNV-1/FNV-1a - http://www.isthe.com/chongo/tech/comp/fnv/#FNV-param
9. Dict lookup implementation in CPython - https://github.com/python/cpython/blob/de7d67b19b9f31d7712de7211ffac5bf6018157f/Objects/dictobject.c#L1058
10. Example of FNV1a realisation in python - https://github.com/znerol/py-fnvhash
11. SipHash paper - https://www.aumasson.jp/siphash/siphash.pdf