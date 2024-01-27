import scala.annotation.tailrec
import java.nio.file.{Paths, Files}
import scala.collection.JavaConverters._

// TODO
// 1. move search and listToBalancedBinaryTree as method of Tree use companion objects for that
// 2. rename everything)
// 3. (optional) build tree with js (scala.js)?
sealed trait Tree

case object EmptyTree extends Tree

case class TreeNode(value: Int, eft: Tree, right: Tree) extends Tree

object BalancedBinaryTreeConverter {
  def time[T](block: => T): T = {
    val before = System.nanoTime
    val result = block
    val after = System.nanoTime
    println("Elapsed time: " + (after - before) / 1000 + " micro seconds")
    result
  }

  def readIntsFromFile(filePath: String): List[Int] = {
    val path = Paths.get(filePath)

    if (Files.exists(path)) {
      val lines = Files.readAllLines(path).asScala
      lines.flatMap(line => line.split(",").map(_.trim.toInt)).toList
    } else {
      throw new IllegalArgumentException(s"File not found: $filePath")
    }
  }

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

  @tailrec
  def search(tree: Tree, target: Int, path: String = "Start "): String = tree match {
    case EmptyTree => "Element doesn't exist"
    case TreeNode(value, left, right) =>
      val pavedPath = path + s"-> $value "
      if (target == value) path
      else if (target < value) search(left, target, pavedPath)
      else search(right, target, pavedPath)
  }

  def searchAsList(tree: List[Int], target: Int): String = {
    var contains = false
    for (el <- tree) {
      if (el == target)
        contains = true
    }
    if (!contains) "Element doesn't exist" else "Element is in the list"
  }

  def main(args: Array[String]): Unit = {
    val intsPath = "programming/Binary Tree/integers.txt"
    val targetPath = "programming/Binary Tree/tests.txt"
    val numbers = readIntsFromFile(intsPath)
    val targets = readIntsFromFile(targetPath)
    println(s"Number of ints: ${numbers.size}")
    println(s"Number of targets: ${targets.size}. Targets: $targets")

    val balancedBinaryTree = time(listToBalancedBinaryTree(numbers))

    println("BT search   ------------------------")
    targets
      .foreach { target =>
        val result = time(search(balancedBinaryTree, target))
        println(s"Search $target: $result")
      }

    println("Loop search ------------------------")
    targets
      .foreach { target =>
        val result = time(searchAsList(numbers, target))
        println(s"Search $target: $result")
      }

  }
}
