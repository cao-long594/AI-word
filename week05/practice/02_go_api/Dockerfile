
# 第一阶段：构建 Go 二进制
FROM golang:1.25-alpine AS builder

# 设置工作目录
WORKDIR /app

# 先复制依赖文件，利用 Docker 缓存
COPY go.mod go.sum ./

# 下载依赖
RUN go mod download

# 复制项目源码
COPY . .

# 编译 Linux 可执行文件
# CGO_ENABLED=0: 关闭 CGO，生成静态链接二进制，便于在极简镜像中运行
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o server .

# 第二阶段:使用极简的 alpine
FROM alpine:3.20

# 设置工作目录
WORKDIR /app

# 从构建阶段复制二进制文件
COPY --from=builder /app/server .

# 声明容器监听端口
EXPOSE 8081

# 启动应用
CMD ["./server"]