package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"gin-grpc-file-service/file-service/internal/model"
)

type FileRepository struct {
	db *sql.DB
}

func NewFileRepository(db *sql.DB) *FileRepository {
	return &FileRepository{db: db}
}

func (r *FileRepository) Create(ctx context.Context, file *model.File) (*model.File, error) {
	const query = `
INSERT INTO files (original_name, stored_name, size, mime_type, path)
VALUES (?, ?, ?, ?, ?);`

	result, err := r.db.ExecContext(ctx, query, file.OriginalName, file.StoredName, file.Size, file.MimeType, file.Path)
	if err != nil {
		return nil, fmt.Errorf("insert file: %w", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return nil, fmt.Errorf("get file id: %w", err)
	}

	file.ID = id
	return file, nil
}

func (r *FileRepository) List(ctx context.Context) ([]*model.File, error) {
	const query = `
SELECT id, original_name, stored_name, size, mime_type, path
FROM files
ORDER BY id ASC;`

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("list files: %w", err)
	}
	defer rows.Close()

	files := make([]*model.File, 0)
	for rows.Next() {
		file := new(model.File)
		if err := rows.Scan(&file.ID, &file.OriginalName, &file.StoredName, &file.Size, &file.MimeType, &file.Path); err != nil {
			return nil, fmt.Errorf("scan file: %w", err)
		}
		files = append(files, file)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate files: %w", err)
	}
	return files, nil
}

func (r *FileRepository) GetByID(ctx context.Context, id int64) (*model.File, error) {
	const query = `
SELECT id, original_name, stored_name, size, mime_type, path
FROM files
WHERE id = ?;`

	file := new(model.File)
	err := r.db.QueryRowContext(ctx, query, id).Scan(&file.ID, &file.OriginalName, &file.StoredName, &file.Size, &file.MimeType, &file.Path)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get file: %w", err)
	}
	return file, nil
}
