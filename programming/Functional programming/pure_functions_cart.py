



class BetterShoppingCart:
    items = []

    def add_item(self, item: str) -> None:
        self.items.append(item)

    def get_items(self) -> list[str]:
        return self.items.copy()

    def remove_item(self, item: str) -> None:
        self.items.remove(item)

    def get_discount_percentage(self, items: list) -> int:
        if "Book" in items:
            return 5
        return 0


class ShoppingCart:
    items = []
    book_added = False

    def add_item(self, item: str) -> None:
        self.items.append(item)
        if item == "Book":
            self.book_added = True

    def get_discount_percentage(self) -> int:
        if self.book_added:
            return 5
        return 0

    def get_items(self) -> list[str]:
        return self.items

    def remove_item(self, item: str) -> None:
        self.items.remove(item)
        if item == "Book":
            self.book_added = False

if __name__ == "__main__":
    shopping_cart = ShoppingCart() # BetterShoppingCart()
    print(shopping_cart.get_discount_percentage())
    shopping_cart.add_item("Book")
    print(shopping_cart.get_discount_percentage())

    # problems we have here
    # 1. get_items returns items that can be changed outside or the class
    my_items = shopping_cart.get_items()
    print(my_items)
    my_items.remove("Book")
    print(my_items)
    print(shopping_cart.get_items())
    print(shopping_cart.get_discount_percentage())

    # 2. if we want to remove items from cart we need to recalculate book_added state
    shopping_cart.add_item("Book")
    shopping_cart.add_item("Book")
    shopping_cart.remove_item("Book")
    print(shopping_cart.get_items())
    print(shopping_cart.get_discount_percentage())


