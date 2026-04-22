# 第一阶段：使用 Go 镜像编译后端程序
FROM golang:1.25-alpine AS builder

# 设置构建阶段的工作目录
WORKDIR /app

# 先复制依赖清单，便于利用 Docker 缓存
COPY go.mod go.sum ./

# 下载 Go 模块依赖
RUN go mod download

# 复制后端项目源码
COPY . .

# 编译 Linux 可执行文件，关闭 CGO 以减少运行环境依赖
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o server .

# 第二阶段：使用精简镜像运行程序
FROM alpine:3.20

# 设置运行阶段的工作目录
WORKDIR /app

# 复制编译好的二进制文件
COPY --from=builder /app/server .

# 声明后端服务端口
EXPOSE 8080

# 启动后端服务
CMD ["./server"]
