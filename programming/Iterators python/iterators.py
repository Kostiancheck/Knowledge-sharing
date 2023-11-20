class Foo:
    def __init__(self, collection):
        self.collection = collection
        self.index = 0

    def __iter__(self):
        """
        we return self so the 'iterator object' 
        is the Foo class instance itself,
        
        but we could have returned a new instance 
        of a completely different class, so long as
        that other class had __next__ defined on it.
        """
        return self

    def __next__(self):
        """
        this method is handling state and informing
        the container of the iterator where we are
        currently pointing to within our data collection.
        """
        if self.index > len(self.collection)-1:
            raise StopIteration

        value = self.collection[self.index]
        self.index += 1

        return value

# we are now able to loop over our custom Foo class!
f = Foo(["a", "b", "c"])
for element in f:
    for element1 in f:
        print(element, element1)
