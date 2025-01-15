package db

import (
	"fmt"
	"log"
	"strconv"

	"go_web/config"
	"go_web/model"

	"github.com/gofiber/fiber/v2"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func ConnectDB() {
	var err error
	p := config.Config("DB_PORT")
	port, err := strconv.ParseUint(p, 10, 32)
	if err != nil {
		panic("Failed to parse database port")
	}

	dsn := fmt.Sprintf(
		"host=localhost port=%d user=%s password=%s dbname=%s sslmode=disable",
		port,
		config.Config("DB_USER"),
		config.Config("DB_PASSWORD"),
		config.Config("DB_NAME"),
	)
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		panic("Failed to connect database")
	}

	log.Printf("Connection Opened to Database")
	if !fiber.IsChild() {
		DB.AutoMigrate(&model.Note{}, &model.User{})
		log.Printf("Database Migrated")
	}
}
