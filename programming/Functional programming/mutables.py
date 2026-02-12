def add_item(plan: list, new_item: str) -> list:
    plan.append(new_item)
    return plan

def add_item_save(plan: list[str], new_item: str)(implicit spark) -> list[str]:
    return plan + [new_item]


if __name__=='__main__':
    plan = ["a", "b", "c"]
    print(plan)
    new_plan = add_item_save(plan, "d")
    print(plan)
    print(new_plan)


    # print(plan.append("e"))
    # print(plan.remove("e"))
    # print(plan.pop(3))
