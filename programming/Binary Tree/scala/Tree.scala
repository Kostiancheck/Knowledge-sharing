package scala

sealed trait Tree {
  def search(target: Int): Boolean
}

case object EmptyTree extends Tree {
  override def search(target: Int): Boolean = false
}

case class TreeNode(value: Int, left: Tree, right: Tree) extends Tree {
  override def search(target: Int): Boolean = {
    if (target == value) true
    else if (target < value) left.search(target)
    else right.search(target)
  }
}


case object Tree {
  def listToBalancedBinaryTree(nums: List[Int]): Tree = {

    def buildBalancedTree(sortedNums: List[Int]): Tree = {
      sortedNums match {
        case Nil => EmptyTree
        case _ =>
          val middleIndex = sortedNums.length / 2
          val middleValue = sortedNums(middleIndex)
          val (left, right) = sortedNums.splitAt(middleIndex)
          TreeNode(middleValue, buildBalancedTree(left), buildBalancedTree(right.tail))
      }
    }

    val sortedNums = nums.sorted
    buildBalancedTree(sortedNums)
  }
}


