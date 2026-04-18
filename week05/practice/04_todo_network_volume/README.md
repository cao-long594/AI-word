# 练习四启动说明


## 启动步骤

以下命令在 `week05/practice/04_todo_network_volume` 目录下执行。

### 1. 进入目录

```powershell
cd D:\WPS-go\caohuiyou\week05\practice\04_todo_network_volume
```

### 2. 创建自定义网络

```powershell
docker network create todo-net
```



### 3. 构建后端镜像

```powershell
docker build -t todo-backend .
```

### 4. 启动后端容器

要求点：

- 容器名固定为 `go-backend`
- 加入 `todo-net`
- 不使用 `-p` 映射宿主机端口
- 把当前目录下的 `data/` 挂载到容器 `/app/data/`

```powershell
docker run -d `
  --name go-backend `
  --network todo-net `
  -v "${PWD}\data:/app/data" `
  todo-backend
```


### 5. 构建前端镜像

```powershell
docker build -t todo-frontend .
```

### 6. 启动前端容器

要求点：

- 容器加入 `todo-net`
- 容器 `80` 端口映射到宿主机 `80` 端口
- 前端通过 `nginx.conf` 中的 `/api/` 代理访问后端容器 `go-backend:8081`

```powershell
docker run -d `
  --name react-nginx-container `
  --network todo-net `
  -p 80:80 `
  todo-frontend
```

