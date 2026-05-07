package main

import (
	"log"
	"os"

	"gin-grpc-file-service/file-web/internal/grpcclient"
	"gin-grpc-file-service/file-web/internal/handler"
	"gin-grpc-file-service/file-web/internal/service"
	"gin-grpc-file-service/file-web/internal/storage"
	"github.com/gin-gonic/gin"
)

func main() {
	addr := env("FILE_WEB_ADDR", ":8080")
	grpcAddr := env("FILE_SERVICE_GRPC_ADDR", "localhost:50051")
	uploadDir := env("FILE_WEB_UPLOAD_DIR", "uploads")

	client, err := grpcclient.NewFileClient(grpcAddr)
	if err != nil {
		log.Fatalf("create grpc client: %v", err)
	}
	defer client.Close()

	localStorage, err := storage.NewLocalStorage(uploadDir)
	if err != nil {
		log.Fatalf("create local storage: %v", err)
	}

	fileService := service.NewFileService(client, localStorage)
	fileHandler := handler.NewFileHandler(fileService)

	router := gin.Default()
	fileHandler.RegisterRoutes(router)

	log.Printf("file-web listening on %s", addr)
	if err := router.Run(addr); err != nil {
		log.Fatalf("serve http: %v", err)
	}
}

func env(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}
