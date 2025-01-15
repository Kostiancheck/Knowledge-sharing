package model

import "gorm.io/gorm"

type Note struct {
	gorm.Model
	Title string `gorm:"not null" json:"title"`
	Text  string `gorm:"not null" json:"text"`
}
