## Tree
First, let's recall what is a tree.
A tree is a set of connected nodes (basically a graph, but don't say that[1]) which has root node and where all nodes have exactly one parent.
![[Pasted image 20240124154521.png]]
Friendly reminder: **leafs** are nodes with no children (just like me!)
![[Pasted image 20240124163520.png]]

**Height** of node is the longest downward path to leaf. Height of tree is height of root.
![[Pasted image 20240124163236.png]]

**Depth** is length of path to root. **Level** is the same.
![[Pasted image 20240124163705.png]]
A nice property of trees is that **each child is like the root node of its own subtree**. Therefore, you can use recursion to navigate trees.
![[Pasted image 20240124155321.png]]



Last thing - Trees are *abstract* data types. The actual data structure implementing a tree is often similar to a linked list. But for some specific trees, other implementation may be better. For example, you can implement Binary Tree with a single array (think how?). And the most efficient implementation of Trie (Digital Tree) is 2D-array [source 3].

[1] In graph theory, there are several definitions of graph, and definitions of node (vertex), link (edge) and tree are a little different from those in computer science.

## Binary Tree

Binary trees are a subset of trees. Binary tree limits number of children to "at most 2". Sometimes children nodes are referred to as "left" or "right".
![[Pasted image 20240124160454.png]]


### Types of binary trees

**Full binary tree** is a binary tree where all nodes have 2 or 0 children.
![[Pasted image 20240124164750.png]]


**Perfect binary tree** is a binary tree where all leafs are on the same level, and each non-leaf node has exactly 2 children.
![[Waldburg_Ahnentafel_Sigmund_Christoph_von_Waldburg.jpg]]

**Balanced binary tree** is a binary tree where left and right subtrees for each node differ in height by no more than 1.
![[Pasted image 20240124165458.png]]
You can re-balance it by changing links.
![[Pasted image 20240124170507.png]]

### Practical uses of binary trees

There are three main uses of binary trees.

1. **Binary Search Tree** - binary tree sorted in a way so that each node has value that is more than each value in left subtree and less than each value in right subtree. It is very useful for quickly searching a key in a tree. An example above is a BST.
2. **Binary Heap** - binary tree sorted in a way so that each node has value that is greater than (or less than) the values of it's children. Primarily used for priority queue. There are other, more time efficient heaps, but binary heap is one of more space-efficient, because it's implemented with a single array.
	   ![[Pasted image 20240124184539.png]]
![[Pasted image 20240124184554.png]]
3. **Huffman coding** - basically, you create a BST but frequency-sorted, each leaf representing character.
   ![[Pasted image 20240124190151.png]]
10000101011101110001


## Task
1. Generate list of unique integers. The list may be of arbitrary size. The list must be unsorted.
2. Create a balanced binary tree where each node will represent a integer from the list.
3. Write a function to retrieve any given integer from balanced binary search tree. Return None if not found.
4. (Optional) measure it's performance VS for loop on unsorted list.


## Sources
1. Binary Tree wikipedia: https://en.wikipedia.org/wiki/Binary_tree
2. Binary Search Tree visualizer: https://www.cs.usfca.edu/~galles/visualization/BST.html
3. Trie 2D array implementation: https://www.co-ding.com/assets/pdf/dat.pdf
4. Binary Heap insertion/deletion explained (video): https://www.youtube.com/watch?v=AE5I0xACpZs
5. Huffman Tree generator: https://huffman.ooz.ie/
6. Balanced Binary Trees: https://www.cs.cornell.edu/courses/cs2112/2022fa/lectures/avl/
7. Balanced BST on array: https://piergiu.wordpress.com/2010/02/21/balanced-binary-search-tree-on-array/