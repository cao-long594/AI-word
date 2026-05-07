# file-web

Gin Web 服务，负责接收 HTTP 请求、保存上传文件、计算文件 hash，并调用 gRPC 文件服务保存文件记录。

## 职责

```text
1. 接收 HTTP 请求
2. 保存文件到本地 uploads 目录
3. 计算文件 hash，并基于 hash 生成新文件名
4. 调用 gRPC 文件服务保存或查询文件记录
```

## 目录

```text
file-web/
├── cmd/
│   └── main.go
├── internal/
│   ├── handler/
│   ├── service/
│   ├── grpcclient/
│   └── storage/
├── uploads/
├── gen/
│   └── filepb/
├── go.mod
└── README.md
```

## 配置

默认配置：

```text
HTTP 地址:       :8080
gRPC 服务地址:   localhost:50051
上传目录:        uploads
```

可通过环境变量覆盖：

```text
FILE_WEB_ADDR
FILE_SERVICE_GRPC_ADDR
FILE_WEB_UPLOAD_DIR
```

## 接口

```text
POST /api/files/uploads
GET  /api/files
GET  /api/files/download/:id
```

上传接口使用 `multipart/form-data`，文件字段名优先使用 `files`，也兼容单文件字段名 `file`。



## 启动

需要先启动 `file-service`，再启动当前服务：

```powershell
cd file-web
go run .\cmd
```
