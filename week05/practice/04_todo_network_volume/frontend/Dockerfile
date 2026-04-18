# 第一阶段：构建前端应用
FROM node:20-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装项目依赖
RUN npm ci

# 复制前端全部源码
COPY . .

# 执行前端打包
RUN npm run build

# 第二阶段：使用 Nginx 托管静态资源
FROM nginx:alpine

# 将构建产物复制到 Nginx 默认静态目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制自定义 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露 Nginx 服务端口
EXPOSE 80

# 以前台方式启动 Nginx
CMD ["nginx", "-g", "daemon off;"]
