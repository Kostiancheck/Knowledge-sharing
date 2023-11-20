class SkipObject:
    def __init__(self, wrapped):
        self.wrapped = wrapped
    def __iter__(self):
        return Skipiterator(self.wrapped)

class Skipiterator:
    def __init__(self, wrapped):
        self.wrapped = wrapped
        self.offset = 0
    def __next__(self) :
        if self.offset >= len(self.wrapped): # Прекратить итерацию
            raise StopIteration
        else:
            item = self.wrapped[self.offset] # Иначе возвратить и пропустить
            self.offset += 2
            return item

alpha = 'abcdef'
skipper = SkipObject(alpha)
I = iter(skipper)
print(next(I), next(I), next(I))
for x in skipper:
    for y in skipper:
        print(x,y)
