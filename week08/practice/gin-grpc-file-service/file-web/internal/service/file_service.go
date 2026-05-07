package service

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"path/filepath"
	"strings"
	"time"

	filepb "gin-grpc-file-service/file-web/gen/filepb"
	"gin-grpc-file-service/file-web/internal/grpcclient"
	"gin-grpc-file-service/file-web/internal/storage"
)

type FileService struct {
	client  *grpcclient.FileClient
	storage *storage.LocalStorage
}

func NewFileService(client *grpcclient.FileClient, storage *storage.LocalStorage) *FileService {
	return &FileService{client: client, storage: storage}
}

func (s *FileService) SaveUploadedFile(ctx context.Context, header *multipart.FileHeader) (*filepb.FileInfo, error) {
	file, err := header.Open()
	if err != nil {
		return nil, fmt.Errorf("open uploaded file: %w", err)
	}
	defer file.Close()

	data, err := io.ReadAll(file)
	if err != nil {
		return nil, fmt.Errorf("read uploaded file: %w", err)
	}

	sum := sha256.Sum256(data)
	hash := hex.EncodeToString(sum[:])
	ext := strings.ToLower(filepath.Ext(header.Filename))
	storedName := hash + ext

	path, err := s.storage.Save(storedName, data)
	if err != nil {
		return nil, err
	}

	mimeType := http.DetectContentType(data)
	if header.Header.Get("Content-Type") != "" {
		mimeType = header.Header.Get("Content-Type")
	}

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	return s.client.SaveFile(ctx, &filepb.SaveFileRequest{
		OriginalName: header.Filename,
		StoredName:   storedName,
		Size:         int64(len(data)),
		MimeType:     mimeType,
		Path:         path,
	})
}

func (s *FileService) ListFiles(ctx context.Context) ([]*filepb.FileInfo, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	return s.client.ListFiles(ctx)
}

func (s *FileService) GetFile(ctx context.Context, id int64) (*filepb.FileInfo, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	return s.client.GetFile(ctx, id)
}
