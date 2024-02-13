---
banner: "![[Pasted image 20240208193912.png]]"
---
# Array
An array is a linear data structure that collects elements of the **same data** type and stores them in contiguous and adjacent memory locations. Arrays work on an index system

**When you define the size of the array, all of that space in memory is “reserved” from that moment on** for future values that you may want to insert. If you do not fill the array with values, that space will be kept reserved and empty until you do
![[Pasted image 20240208211244.png]]

For more information and nice interactive examples see Source 1

# Why index starts from 0?
Let's say you have array of ints in C where size of int is 4 bytes. The length of the array is 100 elements.
Let's assume that the header of the array is in position 1300 in memory. To get element 2 from the array you simply need to do `HEADER + INDEX * ELEMENT_SIZE = 1300 + 2 * 4 = 1308` , so the position of the element 2 is `1308` . But what if you want to get the first element (element 1) of the array? Using the same formula you will get `1304` but we now that the first element of the array must be in the same place as it's header. It means that INDEX of the first element is not really 1, but 0, because `FIRST_ELEMENT = HEADER + INDEX * ELEMENT_SIZE = HEADER + 0 * ELEMENT_SIZE = HEADER` 
![[Pasted image 20240212224856.png|500]]


But in real world something that starts from 0 doesn't ex.... Wait a second
![[Pasted image 20240208204052.png]]
Think about array like about a ruler. Gap between 0 and 1 is the **FIRST** centimetre, but the beginning of the **first** centimetre starts at 0. Same for array, first element starts at index 0, because similar to ruler we have continues memory location but instead of mm and cm we have bits and bytes. 

So for array the sequence number of the, for example, second element is 2, but index is 1, because we need not the sequence number, but the beginning of the first element, the head of the first element. And to get it we need to use indexes that starts from 0.

# Python list
Under the Python list is C dynamic array of pointers to PyObjects. Pointers all of them are the same type (something like `*PyObject`) so they have the same specific size.

Dynamic means that when you create a list and add items, Python will allocate more space than you need to anticipate future additions. If you keep adding elements beyond the allocated space, Python automatically reallocates the list by creating a larger array and copying the data.
# Sources:
1. Nice page with interactive arrays https://nan-archive.vercel.app/how-arrays-work
2. Why does the Array Index start at 0? https://scientyficworld.org/why-does-the-array-index-start-at-zero/
3. Python list in depth - https://hackr.io/blog/python-lists
4. CPython PyListObject - https://github.com/python/cpython/blob/7861dfd26a41e40c2b4361eb0bb1356b9b4a064b/Include/cpython/listobject.h#L5