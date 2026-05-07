package storage

import (
	"fmt"
	"os"
	"path/filepath"
)

type LocalStorage struct {
	dir string
}

func NewLocalStorage(dir string) (*LocalStorage, error) {
	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, fmt.Errorf("create upload directory: %w", err)
	}
	return &LocalStorage{dir: dir}, nil
}

func (s *LocalStorage) Save(storedName string, data []byte) (string, error) {
	path := filepath.Join(s.dir, storedName)
	if err := os.WriteFile(path, data, 0644); err != nil {
		return "", fmt.Errorf("save file: %w", err)
	}
	return filepath.ToSlash(path), nil
}

func (s *LocalStorage) Path(storedName string) string {
	return filepath.Join(s.dir, storedName)
}
