# file-service

gRPC 文件服务，负责保存文件记录、查询文件列表和根据 ID 查询单个文件记录。数据使用 SQLite 保存。

## 职责

```text
1. 提供 gRPC 接口
2. 使用 SQLite 保存文件记录
3. 查询文件列表
4. 根据文件 ID 查询文件记录
```

## 目录

```text
file-service/
├── cmd/
│   └── main.go
├── internal/
│   ├── handler/
│   ├── service/
│   ├── repository/
│   ├── model/
│   └── database/
├── data/
├── gen/
│   └── filepb/
├── go.mod
└── README.md
```

## 配置

默认配置：

```text
gRPC 地址:       :50051
SQLite 数据库:   data/files.db
```

可通过环境变量覆盖：

```text
FILE_SERVICE_ADDR
FILE_SERVICE_DB
```

## 数据字段

SQLite 表 `files` 保存以下字段：

```text
id
original_name
stored_name
size
mime_type
path
created_at
```

其中 `original_name` 保存用户上传时的原始文件名，`stored_name` 保存基于 hash 生成的新文件名。

## 启动

```powershell
cd file-service
go run .\cmd
```
