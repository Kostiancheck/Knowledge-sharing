package router

import (
	"go_web/handlers"

	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(app *fiber.App) {
	app.Get("/", handlers.HealthCheck)

	api := app.Group("/api")

	v1 := api.Group("/v1")

	v1.Get("/notes", handlers.GetAllNotes)
	v1.Get("/notes/:id", handlers.GetNote)
	v1.Post("/notes", handlers.CreateNote)
	v1.Put("/notes/:id", handlers.UpdateNote)
	v1.Delete("/notes/:id", handlers.DeleteNote)
}
