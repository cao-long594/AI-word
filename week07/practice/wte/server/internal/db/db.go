package db

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"wte/server/internal/model"
)

func Open(path string) (*gorm.DB, error) {
	if err := ensureDir(path); err != nil {
		return nil, err
	}

	database, err := gorm.Open(sqlite.Open(path), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn),
	})
	if err != nil {
		return nil, fmt.Errorf("open sqlite: %w", err)
	}

	if err := database.Exec("PRAGMA foreign_keys = ON").Error; err != nil {
		return nil, fmt.Errorf("enable foreign keys: %w", err)
	}

	return database, nil
}

func AutoMigrate(database *gorm.DB) error {
	return database.AutoMigrate(
		&model.User{},
		&model.Topic{},
		&model.Post{},
		&model.Comment{},
	)
}

func ensureDir(path string) error {
	dir := filepath.Dir(path)
	if dir == "." || dir == "" {
		return nil
	}
	return os.MkdirAll(dir, 0o755)
}
