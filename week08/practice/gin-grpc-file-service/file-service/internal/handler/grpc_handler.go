package handler

import (
	"context"
	"errors"

	filepb "gin-grpc-file-service/file-service/gen/filepb"
	"gin-grpc-file-service/file-service/internal/model"
	"gin-grpc-file-service/file-service/internal/service"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type FileHandler struct {
	filepb.UnimplementedFileServiceServer
	service *service.FileService
}

func NewFileHandler(service *service.FileService) *FileHandler {
	return &FileHandler{service: service}
}

func (h *FileHandler) SaveFile(ctx context.Context, req *filepb.SaveFileRequest) (*filepb.FileInfo, error) {
	file, err := h.service.Save(ctx, &model.File{
		OriginalName: req.GetOriginalName(),
		StoredName:   req.GetStoredName(),
		Size:         req.GetSize(),
		MimeType:     req.GetMimeType(),
		Path:         req.GetPath(),
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "save file: %v", err)
	}
	return toProto(file), nil
}

func (h *FileHandler) ListFiles(ctx context.Context, _ *filepb.ListFilesRequest) (*filepb.ListFilesResponse, error) {
	files, err := h.service.List(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "list files: %v", err)
	}

	resp := &filepb.ListFilesResponse{Files: make([]*filepb.FileInfo, 0, len(files))}
	for _, file := range files {
		resp.Files = append(resp.Files, toProto(file))
	}
	return resp, nil
}

func (h *FileHandler) GetFile(ctx context.Context, req *filepb.GetFileRequest) (*filepb.FileInfo, error) {
	file, err := h.service.Get(ctx, req.GetId())
	if errors.Is(err, service.ErrFileNotFound) {
		return nil, status.Error(codes.NotFound, "file not found")
	}
	if err != nil {
		return nil, status.Errorf(codes.Internal, "get file: %v", err)
	}
	return toProto(file), nil
}

func toProto(file *model.File) *filepb.FileInfo {
	return &filepb.FileInfo{
		Id:           file.ID,
		OriginalName: file.OriginalName,
		StoredName:   file.StoredName,
		Size:         file.Size,
		MimeType:     file.MimeType,
		Path:         file.Path,
	}
}
