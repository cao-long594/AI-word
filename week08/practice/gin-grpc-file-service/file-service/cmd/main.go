package main

import (
	"log"
	"net"
	"os"

	filepb "gin-grpc-file-service/file-service/gen/filepb"
	"gin-grpc-file-service/file-service/internal/database"
	"gin-grpc-file-service/file-service/internal/handler"
	"gin-grpc-file-service/file-service/internal/repository"
	"gin-grpc-file-service/file-service/internal/service"
	"google.golang.org/grpc"
)

func main() {
	addr := env("FILE_SERVICE_ADDR", ":50051")
	dbPath := env("FILE_SERVICE_DB", "data/files.db")

	db, err := database.Open(dbPath)
	if err != nil {
		log.Fatalf("open database: %v", err)
	}
	defer db.Close()

	lis, err := net.Listen("tcp", addr)
	if err != nil {
		log.Fatalf("listen %s: %v", addr, err)
	}

	repo := repository.NewFileRepository(db)
	fileService := service.NewFileService(repo)
	grpcServer := grpc.NewServer()
	filepb.RegisterFileServiceServer(grpcServer, handler.NewFileHandler(fileService))

	log.Printf("file-service listening on %s", addr)
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("serve grpc: %v", err)
	}
}

func env(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}
