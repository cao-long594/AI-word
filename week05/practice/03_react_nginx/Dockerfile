# 使用 docker build -t react-nginx-demo . 构建镜像

# 第一阶段：构建前端应用
FROM node:20-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 lock 文件
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制项目全部文件
COPY . .

# 构建生产包
RUN npm run build

# 第二阶段：使用 Nginx 托管静态资源
FROM nginx:alpine

# 将打包产物复制到 Nginx 默认站点目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 替换默认 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露 80 端口
EXPOSE 80

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]
