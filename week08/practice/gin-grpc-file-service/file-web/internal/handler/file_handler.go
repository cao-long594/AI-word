package handler

import (
	"net/http"
	"os"
	"path/filepath"
	"strconv"

	filepb "gin-grpc-file-service/file-web/gen/filepb"
	"gin-grpc-file-service/file-web/internal/service"
	"github.com/gin-gonic/gin"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type FileHandler struct {
	service *service.FileService
}

func NewFileHandler(service *service.FileService) *FileHandler {
	return &FileHandler{service: service}
}

func (h *FileHandler) RegisterRoutes(router *gin.Engine) {
	api := router.Group("/api/files")
	api.POST("/uploads", h.UploadFiles)
	api.GET("", h.ListFiles)
	api.GET("/download/:id", h.DownloadFile)
}

func (h *FileHandler) UploadFiles(c *gin.Context) {
	files := c.Request.MultipartForm
	if files == nil {
		if err := c.Request.ParseMultipartForm(32 << 20); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid multipart form"})
			return
		}
		files = c.Request.MultipartForm
	}

	headers := files.File["files"]
	if len(headers) == 0 {
		headers = files.File["file"]
	}
	if len(headers) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing upload field: files"})
		return
	}

	results := make([]*filepb.FileInfo, 0, len(headers))
	for _, header := range headers {
		result, err := h.service.SaveUploadedFile(c.Request.Context(), header)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		results = append(results, result)
	}

	if len(results) == 1 {
		c.JSON(http.StatusOK, results[0])
		return
	}
	c.JSON(http.StatusOK, results)
}

func (h *FileHandler) ListFiles(c *gin.Context) {
	files, err := h.service.ListFiles(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, files)
}

func (h *FileHandler) DownloadFile(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid file id"})
		return
	}

	file, err := h.service.GetFile(c.Request.Context(), id)
	if status.Code(err) == codes.NotFound {
		c.JSON(http.StatusNotFound, gin.H{"error": "file not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	path := filepath.FromSlash(file.GetPath())
	if _, err := os.Stat(path); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "stored file not found"})
		return
	}

	c.FileAttachment(path, file.GetOriginalName())
}
