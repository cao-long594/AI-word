package grpcclient

import (
	"context"
	"fmt"

	filepb "gin-grpc-file-service/file-web/gen/filepb"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

type FileClient struct {
	conn   *grpc.ClientConn
	client filepb.FileServiceClient
}

func NewFileClient(addr string) (*FileClient, error) {
	conn, err := grpc.NewClient(addr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, fmt.Errorf("connect file-service: %w", err)
	}

	return &FileClient{
		conn:   conn,
		client: filepb.NewFileServiceClient(conn),
	}, nil
}

func (c *FileClient) Close() error {
	return c.conn.Close()
}

func (c *FileClient) SaveFile(ctx context.Context, req *filepb.SaveFileRequest) (*filepb.FileInfo, error) {
	return c.client.SaveFile(ctx, req)
}

func (c *FileClient) ListFiles(ctx context.Context) ([]*filepb.FileInfo, error) {
	resp, err := c.client.ListFiles(ctx, &filepb.ListFilesRequest{})
	if err != nil {
		return nil, err
	}
	return resp.GetFiles(), nil
}

func (c *FileClient) GetFile(ctx context.Context, id int64) (*filepb.FileInfo, error) {
	return c.client.GetFile(ctx, &filepb.GetFileRequest{Id: id})
}
