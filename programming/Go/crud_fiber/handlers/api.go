package handlers

import (
	"go_web/db"
	"go_web/model"

	"github.com/gofiber/fiber/v2"
)

func HealthCheck(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{"status": "success", "data": "Status ok"})
}

func GetAllNotes(c *fiber.Ctx) error {
	db := db.DB
	var notes []model.Note
	db.Find(&notes)
	return c.JSON(fiber.Map{"status": "success", "data": notes})
}

func GetNote(c *fiber.Ctx) error {
	id := c.Params("id")
	db := db.DB
	var note model.Note
	db.Find(&note, id)
	if note.Title == "" {
		return c.Status(404).JSON(fiber.Map{"status": "error", "data": nil})
	}
	return c.JSON(fiber.Map{"status": "success", "data": note})
}

func CreateNote(c *fiber.Ctx) error {
	db := db.DB
	note := new(model.Note)
	if err := c.BodyParser(note); err != nil {
		return c.Status(500).JSON(fiber.Map{"status": "error", "data": err})
	}
	db.Create(&note)
	return c.JSON(fiber.Map{"status": "success", "data": note})
}

func UpdateNote(c *fiber.Ctx) error {
	type UpdateNoteInput struct {
		Title string `json:"title"`
		Text  string `json:"text"`
	}
	var uni UpdateNoteInput
	var note model.Note
	db := db.DB
	id := c.Params("id")

	if err := c.BodyParser(&uni); err != nil {
		return c.Status(500).JSON(fiber.Map{"status": "error", "data": err})
	}

	db.First(&note, id)
	note.Title = uni.Title
	note.Text = uni.Text
	db.Save(&note)

	return c.JSON(fiber.Map{"status": "success", "data": note})
}

func DeleteNote(c *fiber.Ctx) error {
	id := c.Params("id")
	db := db.DB

	var note model.Note
	db.First(&note, id)
	if note.Title == "" {
		return c.Status(404).JSON(fiber.Map{"status": "error", "data": nil})
	}
	db.Delete(&note)
	return c.JSON(fiber.Map{"status": "success", "data": nil})
}
