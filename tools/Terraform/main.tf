terraform {
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0.1"
    }
  }
}

provider "docker" {}

resource "docker_image" "nginx" {
  name         = "nginx:latest"
  keep_locally = false
}

resource "docker_container" "nginx" {
  image = docker_image.nginx.image_id
  name  = "tutorial"
  ports {
    internal = 80
    external = 8080
  }
}

output "image_id" {
  description = "ID and Image ID of the Docker image to compare"
  value       = format("ID: %s VS Image ID: %s", docker_image.nginx.id, docker_image.nginx.image_id)
}
