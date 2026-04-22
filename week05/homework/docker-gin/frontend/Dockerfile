# 第一阶段：使用 Node 镜像构建前端静态资源
FROM node:20-alpine AS builder

# 设置构建阶段的工作目录
WORKDIR /app

# 先复制依赖清单，便于复用 Docker 缓存
COPY package*.json ./

# 安装前端依赖
RUN npm ci

# 复制前端项目源码
COPY . .

# 执行 Vite 打包，生成 dist 目录
RUN npm run build

# 第二阶段：使用 Nginx 提供静态资源服务
FROM nginx:alpine

# 将构建产物复制到 Nginx 默认发布目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 使用自定义 Nginx 配置，统一处理前端页面和后端接口转发
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露前端服务端口
EXPOSE 80

# 前台启动 Nginx
CMD ["nginx", "-g", "daemon off;"]
