package scala

import Tree._

import java.nio.file.{Files, Paths, StandardOpenOption}
import scala.collection.JavaConverters._
import scala.util.control.Breaks.{break, breakable}

sealed case class MeasureResult(
                                 execTime: Double,
                                 isIn: Boolean
                               )

object BinaryTreeTest {
  def time[T](block: => T): (Double, T) = {
    val before = System.nanoTime
    val result = block
    val after = System.nanoTime
    val execTime = (after - before).toDouble.round / 1000
    println("Elapsed time: " + execTime + " micro seconds")
    (execTime, result)
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

  def searchAsList(flatTree: List[Int])(target: Int): Boolean = {
    var found = false
    breakable {
      for (num <- flatTree) {
        if (num == target) {
          found = true
          break()
        }
      }
    }
    found
  }

  def searchSpeedTest(func: Int => Boolean, target: Int, repeat: Int): (Int, MeasureResult) = {
    val execResults: Seq[MeasureResult] = (1 to repeat)
      .map { attempts =>
        val (execTime, found) = time(func(target))
        println(s"$attempts) Target $target is in the tree: $found")
        MeasureResult(execTime, found)
      }
    println("---")
    val isIntTheList = execResults.map(_.isIn).reduce(_ && _)
    val avgExecTime = execResults.map(_.execTime).sum / execResults.size
    target -> MeasureResult(avgExecTime, isIntTheList)
  }

  def writeSpeedTestResults(results: Map[Int, MeasureResult], methodType: String, path: String): Unit = {
    val headers = Seq("target", "type", "execution_time").mkString(",") + "\n"
    val content = results
      .map { case (target, measure) => Seq(target, methodType, measure.execTime).mkString(",") }
      .mkString("\n")
    val csvContent = headers + content
    Files.write(Paths.get(path), csvContent.getBytes,
      StandardOpenOption.CREATE, StandardOpenOption.WRITE, StandardOpenOption.TRUNCATE_EXISTING)
  }

  def main(args: Array[String]): Unit = {
    val intsPath = "programming/Binary Tree/integers.txt"
    val targetPath = "programming/Binary Tree/tests.txt"
    val numbers = readIntsFromFile(intsPath)
    val targets = readIntsFromFile(targetPath)
    println(s"Number of ints: ${numbers.size}")
    println(s"Number of targets: ${targets.size}. Targets: $targets")

    val (_, balancedBinaryTree) = time(listToBalancedBinaryTree(numbers))

    println("============ BT search ============")

    val btResults = targets
      .map(target => searchSpeedTest(balancedBinaryTree.search, target, repeat = 20))
      .toMap


    println("============ Loop search ============")

    val loopResults = targets
      .map(target => searchSpeedTest(searchAsList(numbers), target, repeat = 20))
      .toMap

    println("============ Write results ============")

    writeSpeedTestResults(btResults, "binary_tree", "programming/Binary Tree/scala_tree_results.csv")
    writeSpeedTestResults(loopResults, "list", "programming/Binary Tree/scala_loop_results.csv")
  }
}


