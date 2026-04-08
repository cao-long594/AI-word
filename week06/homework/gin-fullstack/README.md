# 实战：中后台系统二次开发

## 学生信息
- 学校：武汉科技大学
- 姓名：曹会友
- 学号：202313407447

---

## 开发任务索引

- 任务1：环境搭建与初始化。将项目数据库由 MySQL/PostgreSQL 调整为 SQLite，并完成项目初始化运行配置。

- 任务2：用户行为追踪功能开发。在用户管理列表页新增“登录IP”和“登录时间”两列，并在用户登录成功后自动记录最近一次登录 IP 和登录时间。

---

## 核心技术实现

### 任务1：环境搭建与初始化
本任务的核心思路是放弃依赖额外数据库服务的 MySQL/PostgreSQL，直接使用轻量级 SQLite 作为项目运行数据库，以降低本地环境搭建复杂度，提升初始化效率。

具体实现如下：
- 修改 `server/config.yaml`
- 将 `system.db-type` 设置为 `sqlite`
- 配置 `sqlite.path` 为本地数据库目录



### 任务2：用户行为追踪功能开发
本任务的核心思路是将“最后登录IP”和“最后登录时间”作为用户基础信息的一部分存储，并在登录成功后自动更新，再由前端用户管理页面直接展示。

具体实现如下：
- 在后端用户模型 `SysUser` 中新增 `loginIp` 和 `loginTime` 字段  
其中`loginTime` 字段是`*time.Time`类型，未登录是是nil
- 在登录成功后的 `TokenNext` 方法中获取当前请求的客户端 IP 和当前时间
- 使用数据库更新语句将最近一次登录信息写回用户表
- 在前端用户管理列表页新增“登录IP”和“登录时间”两列
- 对登录时间使用格式化处理，按 `YYYY-MM-DD HH:mm` 方式展示


---

## 相关改动文件
- `server/config.yaml`
- `server/model/system/sys_user.go`
- `server/api/v1/system/sys_user.go`
- `web/src/view/superAdmin/user/user.vue`
