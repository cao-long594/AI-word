package service

import (
	"context"
	"errors"

	"gin-grpc-file-service/file-service/internal/model"
	"gin-grpc-file-service/file-service/internal/repository"
)

var ErrFileNotFound = errors.New("file not found")

type FileService struct {
	repo *repository.FileRepository
}

func NewFileService(repo *repository.FileRepository) *FileService {
	return &FileService{repo: repo}
}

func (s *FileService) Save(ctx context.Context, file *model.File) (*model.File, error) {
	return s.repo.Create(ctx, file)
}

func (s *FileService) List(ctx context.Context) ([]*model.File, error) {
	return s.repo.List(ctx)
}

func (s *FileService) Get(ctx context.Context, id int64) (*model.File, error) {
	file, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if file == nil {
		return nil, ErrFileNotFound
	}
	return file, nil
}
