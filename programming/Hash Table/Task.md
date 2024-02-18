1. Develop Hash table using arrays and any hash function (u can use hash functions from libs or write your own). 
	1. Hash table must be able to 
		- insert item
		- get item
	2. You don't need to add resizing or advanced collision-resolution functionalities
	3. For collision-resolution policy simply **override** previous value
3. After that go to https://www.kaggle.com/datasets/dfydata/the-online-plain-text-english-dictionary-opted and download csv file with dictionary
4. Read in csv line-by-line and add word-definition pairs to your Hash Table (word is a key, and definition is a value)
5. At the end count number of unique words in original csv and number of words in your hash table. Difference between those two values will show us how many collisions did you get
6. Print out few random words definitions from your Hash Table