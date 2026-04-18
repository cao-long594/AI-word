# 第一阶段：构建 Go 应用
FROM golang:1.25-alpine AS builder

# 安装构建 go-sqlite3 需要的编译工具
RUN apk add --no-cache gcc musl-dev

# 设置 Go 构建参数，SQLite 依赖 CGO，所以这里保持开启
ENV GO111MODULE=on \
    CGO_ENABLED=1 \
    GOOS=linux \
    GOARCH=amd64 \
    GOPROXY=https://goproxy.cn,direct

# 设置工作目录
WORKDIR /app

# 先复制 go.mod 和 go.sum，利用 Docker 缓存加快依赖下载
COPY go.mod go.sum ./

# 下载 Go 依赖
RUN go mod download

# 复制后端全部源码
COPY . .

# 编译生成可执行文件 main
RUN go build -trimpath -ldflags="-s -w" -o main .

# 第二阶段：使用更轻量的运行镜像
FROM alpine:latest

# 安装运行 CGO 程序所需的兼容库
RUN apk add --no-cache libc6-compat

# 设置运行目录
WORKDIR /app

# 创建 SQLite 数据文件所在目录
RUN mkdir -p /app/data

# 从构建阶段复制编译后的可执行文件
COPY --from=builder /app/main .

# 暴露后端服务端口
EXPOSE 8081

# 启动后端服务
CMD ["./main"]
