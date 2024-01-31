from time import perf_counter
import csv

CSV_HEADERS = ["target", "type", "execution_time"]

class TreeNode:
    """
    Represents a node in a tree
    """

    def __init__(self, data):
        self.data = data
        self.left = None
        self.right = None
        self.height = 0

    def is_left_node(self):
        if self.left is None:
            return False
        return True

    def is_right_node(self):
        if self.right is None:
            return False
        return True

    def is_leaf(self):
        if self.left or self.right:
            return False
        return True
    
    def recalculate_height(self):
        if self.is_leaf():
            self.height = 0
        elif not self.is_left_node():
            self.height = self.right.height + 1
        elif not self.is_right_node():
            self.height = self.left.height + 1
        else:
            if self.left.height > self.right.height:
                self.height = self.left.height + 1
            else:
                self.height = self.right.height + 1

    def get_balance(self):
        if self.is_leaf():
            return 0
        elif not self.is_right_node():
            return -self.left.height - 1
        elif not self.is_left_node():
            return self.right.height + 1
        else:
            return self.right.height - self.left.height
        
    def left_rotation(self):
        right_child = self.right
        self.right = right_child.left
        right_child.left = self
        self.recalculate_height()
        right_child.recalculate_height()
        return right_child

    def right_rotation(self):
        left_child = self.left
        self.left = left_child.right
        left_child.right = self
        self.recalculate_height()
        left_child.recalculate_height()
        return left_child

class BBTree:
    """
    Represents balanced binary tree, aka AVL Tree
    """

    def __init__(self, items=None):
        self.root = None
        self.size = 0
        if items:
            self._fill_input_data(items)

    def _fill_input_data(self, items):
        for item in items:
            self.insert(item)

    def is_empty(self):
        return self.root is None

    def insert(self, item, node=None):
        if self.is_empty():
            self.root = TreeNode(item)
            self.size += 1
            return
        if node is None:
            node = self.root
            self.size += 1
        if item == node.data:
            self.size -= 1
            return
        elif item < node.data:
            if node.is_left_node():
                added_subtree = self.insert(item, node.left)
                if added_subtree is not None:
                    node.left = added_subtree
            else:
                added_node = TreeNode(item)
                node.left = added_node
        else:
            if node.is_right_node():
                added_subtree = self.insert(item, node.right)
                if added_subtree is not None:
                    node.right = added_subtree
            else:
                added_node = TreeNode(item)
                node.right = added_node
        node.recalculate_height()
        return self.balance(node)
    
    def balance(self, node):
        bf = node.get_balance()
        if bf < 2 and bf > -2:
            return None
        if bf < -1:
            if node.left.get_balance() < 0:
                new_root = node.right_rotation()
            else:
                node.left = node.left.left_rotation()
                new_root = node.right_rotation()
        else:
            if node.right.get_balance() > 0:
                new_root = node.left_rotation()
            else:
                node.right = node.right.right_rotation()
                new_root = node.left_rotation()
        if node is self.root:
            self.root = new_root
        return new_root
    
    def search(self, item):
        node = self._find_node_recursive(item, self.root)
        return node.data if node else "Not Found In Tree"
    
    def _find_node_recursive(self, item, node):
        if node is None:
            return None
        elif item == node.data:
            return node
        elif item < node.data:
            return self._find_node_recursive(item, node.left)
        elif item > node.data:
            return self._find_node_recursive(item, node.right)

def calc_time(func):
    def wrapper(*args, **kwargs):
        time_start = perf_counter()
        func(*args, **kwargs)
        time_end = perf_counter()
        time_duration = time_end - time_start
        print(f'{func.__name__} took {time_duration*1_000_000_000} nanoseconds')
    return wrapper

def write_to_csv(file_name, items):
    with open(file_name, 'w', encoding='UTF8') as f:
        writer = csv.writer(f)
        writer.writerow(CSV_HEADERS)
        writer.writerows(items)

def calc_time_and_execute(func, num):
    time_start = perf_counter()
    result = func(num)
    print(f"Searched for {num}: {result}")
    time_end = perf_counter()
    time_duration = (time_end - time_start) * 1_000_000_000
    return time_duration

def get_test_search_inputs():
    search_inputs = []
    with open("../tests.txt", "r") as f:
        for line in f:
            for num in line.strip().split(","):
                search_inputs.append(int(num))
    return search_inputs

def test_tree():
    print("="*10,"Searching with Tree", "="*10)
    tree = BBTree()
    with open("../integers.txt", "r") as f:
        for line in f:
            for num in line.strip().split(","):
                tree.insert(int(num))

    results = []
    for num in get_test_search_inputs():
        time_duration = calc_time_and_execute(tree.search, int(num))
        results.append([num, 'binary_tree', time_duration])
    write_to_csv('../python_tree_results.csv', results)

def test_simply_search():
    print("="*10,"Searching with for loop", "="*10)
    items = []
    def search(item):
        for i in items:
            if i == item:
                return i
    with open("../integers.txt", "r") as f:
        for line in f:
            for num in line.strip().split(","):
                items.append(int(num))
    results = []
    for num in get_test_search_inputs():
        time_duration = calc_time_and_execute(search, int(num))
        results.append([num, 'list', time_duration])
    write_to_csv('../python_loop_results.csv', results)
    
if __name__ == "__main__":
    test_tree()
    test_simply_search()