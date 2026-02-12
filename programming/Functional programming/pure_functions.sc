implicit val l: List[String] = List("1", "2", "3")

def arr()(implicit l: List[String]): Unit = {
  println(l)
}

arr()