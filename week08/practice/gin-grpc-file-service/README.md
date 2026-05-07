# Gin + gRPC + SQLite 文件服务

实现 `HTTP -> Gin -> gRPC -> SQLite` 的文件上传、文件列表和文件下载链路。

## 项目结构

```text
gin-grpc-file-service/
├── file-web/
│   ├── cmd/
│   ├── internal/
│   ├── uploads/
│   ├── gen/
│   ├── go.mod
│   └── README.md
├── file-service/
│   ├── cmd/
│   ├── internal/
│   ├── data/
│   ├── gen/
│   ├── go.mod
│   └── README.md
├── proto/
│   └── file.proto
├── .gitignore
├── go.mod
└── README.md
```

`proto/file.proto` 是 gRPC 接口定义。生成后的 Go 代码分别放在：

```text
file-web/gen/filepb/
file-service/gen/filepb/
```

## 功能

- 批量上传文件：`POST /api/files/uploads`
- 查询文件列表：`GET /api/files`
- 按文件 ID 下载：`GET /api/files/download/:id`

上传流程：

```text
接收 HTTP 请求 -> 读取文件 -> 计算 hash -> 保存到 uploads -> 调用 gRPC 保存记录 -> 返回结果
```

下载流程：

```text
接收下载请求 -> 通过 gRPC 查询文件记录 -> 根据记录读取本地文件 -> 返回文件内容
```

## 启动

先启动 gRPC 文件服务：

```powershell
cd file-service
go run .\cmd
```

再启动 Web 服务：

```powershell
cd file-web
go run .\cmd
```

默认地址：

```text
file-service: :50051
file-web:     :8080
```



## Git 忽略

上传文件和数据库文件不提交：

```gitignore
uploads/
file-web/uploads/
file-service/data/
*.db
*.db-shm
*.db-wal
```
