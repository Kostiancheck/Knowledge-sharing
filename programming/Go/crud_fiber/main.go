package main

import (
	"go_web/router"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/compress"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"

	"go_web/db"
)

func main() {
	app := fiber.New(fiber.Config{
		Prefork:       true,
		ServerHeader:  "Fiber",
		CaseSensitive: true,
		StrictRouting: true,
	})

	app.Use(logger.New())
	app.Use(compress.New())
	app.Use(recover.New())
	// app.Use(limiter.New())

	db.ConnectDB()

	router.SetupRoutes(app)

	app.Listen(":3000")
}
