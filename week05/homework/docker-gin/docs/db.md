# 数据库设计文档

本项目使用 `MySQL 8.0`，数据库名为 `wordbook`，字符集为 `utf8mb4`，排序规则为 `utf8mb4_unicode_ci`。  
数据库表结构由 [init.sql](D:\WPS-go\caohuiyou\week05\homework\docker-gin\docs\init.sql) 初始化，通过 SQL 脚本建表，不在 Go 代码中使用 GORM 的 `AutoMigrate` 自动建表。

## MySQL数据库表结构设计

- 支持用户注册与登录
- 支持每个用户维护自己的单词本
- 支持同一用户下单词唯一
- 支持保存 AI 返回的释义、例句和来源模型
- 支持分页查询与软删除

## 1. users 表

表名：`users`

### 字段设计

| 字段名 | 数据类型 | 主键/外键 | 约束/索引 | 业务含义 |
| --- | --- | --- | --- | --- |
| `id` | `BIGINT` | 主键 | `PRIMARY KEY`、`AUTO_INCREMENT` | 用户唯一标识 |
| `username` | `VARCHAR(64)` | 否 | `NOT NULL`、`UNIQUE` | 登录用户名，系统内唯一 |
| `password_hash` | `VARCHAR(255)` | 否 | `NOT NULL` | bcrypt 哈希后的密码，不存明文 |
| `created_at` | `TIMESTAMP` | 否 | `DEFAULT CURRENT_TIMESTAMP` | 用户创建时间 |

### 设计说明

- `username` 使用唯一约束，避免重复注册。
- `password_hash` 长度预留为 `255`，满足 bcrypt 哈希串存储需求。
- `users` 表只保留登录和身份识别必需字段，结构简单。

## 2. words 表

表名：`words`

### 字段设计

| 字段名 | 数据类型 | 主键/外键 | 约束/索引 | 业务含义 |
| --- | --- | --- | --- | --- |
| `id` | `BIGINT` | 主键 | `PRIMARY KEY`、`AUTO_INCREMENT` | 单词记录唯一标识 |
| `user_id` | `BIGINT` | 外键 | `NOT NULL`、`uk_user_word`、`idx_user_created_at` | 该单词所属用户 ID |
| `word` | `VARCHAR(100)` | 否 | `NOT NULL`、`uk_user_word` | 用户保存的单词内容 |
| `meaning` | `TEXT` | 否 | `NOT NULL` | 单词释义 |
| `examples` | `JSON` | 否 | `NOT NULL` | 例句列表，使用 JSON 数组存储 |
| `ai_provider` | `VARCHAR(30)` | 否 | `NOT NULL` | 生成该结果的 AI 提供方，如 `deepseek`、`qwen` |
| `created_at` | `TIMESTAMP` | 否 | `DEFAULT CURRENT_TIMESTAMP`、`idx_user_created_at` | 记录创建时间 |
| `updated_at` | `TIMESTAMP` | 否 | `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | 记录最后更新时间 |
| `deleted_at` | `TIMESTAMP NULL` | 否 | `idx_words_deleted_at` | 软删除时间，为 `NULL` 表示未删除 |

### 索引与约束设计

| 名称 | 类型 | 字段 | 作用 |
| --- | --- | --- | --- |
| `PRIMARY` | 主键 | `id` | 唯一标识每条单词记录 |
| `uk_user_word` | 联合唯一索引 | `user_id`, `word` | 保证同一用户不能重复保存同一个单词 |
| `idx_user_created_at` | 联合普通索引 | `user_id`, `created_at` | 优化“按用户分页查看单词本”的查询 |
| `idx_words_deleted_at` | 普通索引 | `deleted_at` | 优化 GORM 软删除场景下对未删除数据的过滤 |
| `fk_words_user` | 外键 | `user_id -> users.id` | 保证单词记录必须属于有效用户 |

### 设计说明

- `examples` 使用 `JSON` 类型，和后端 `[]string` / `StringSlice` 映射关系清晰，便于直接返回前端。
- `uk_user_word` 控制“单个用户维度下单词唯一”，不同用户可以保存相同单词。
- `deleted_at` 用于软删除。后端删除单词时不会物理删除数据，而是写入删除时间；普通查询默认只返回 `deleted_at IS NULL` 的记录。
- 后端保存单词时会优先查询包含软删除记录的数据；如果发现同一用户下已存在同名单词，则更新内容并把 `deleted_at` 恢复为 `NULL`，避免重复插入。
- 外键 `fk_words_user` 配置了 `ON DELETE CASCADE`，如果用户被删除，其名下单词会一并删除。

## 3. 用户表与单词本表的关联关系设计说明


`users` 与 `words` 采用一对多的关系设计，每一条单词记录都必须明确归属于某一个用户。

具体考虑如下：

- 以 `users.id` 作为主表主键，`words.user_id` 作为从表外键，结构简单，查询路径清晰。
- 一个用户可以保存多条单词记录，因此 `users -> words` 是 `1:N` 关系；反过来，一条单词记录不能同时属于多个用户，因此 `words -> users` 是 `N:1`。
- `uk_user_word (user_id, word)` 联合唯一索引建立在用户维度上，表示“同一个用户不能重复保存同一个单词”，但不同用户可以各自保存相同单词，这符合单词本业务场景。
- 外键 `fk_words_user` 约束保证 `words.user_id` 必须引用有效的用户记录，避免出现孤立的单词数据。
- 配置 `ON DELETE CASCADE` 后，如果用户数据被删除，其名下单词本记录会同步删除，能够保持主从表数据一致性。

从业务角度看，这种关联方式既能满足“每个用户拥有独立单词本”的要求，也便于后端在认证通过后，直接根据 JWT 中解析出的用户 ID 查询和操作该用户自己的单词数据。

## 4. 与后端代码的对应关系

数据库设计和后端实现保持一致：

- `users` 表对应 [model.go](D:\WPS-go\caohuiyou\week05\homework\docker-gin\backend\model\model.go) 中的 `model.User`
- `words` 表对应 [model.go](D:\WPS-go\caohuiyou\week05\homework\docker-gin\backend\model\model.go) 中的 `model.Word`
- `examples` 字段通过自定义类型 `StringSlice` 与 MySQL `JSON` 类型互转
- `DeletedAt` 使用 GORM 软删除字段映射到数据库中的 `deleted_at`

实际业务使用情况如下：

- 登录与注册依赖 `users` 表中的 `username`、`password_hash`
- 查词、保存、分页列表、删除等功能依赖 `words` 表
- 分页列表按 `created_at DESC` 排序，配合 `idx_user_created_at` 提高查询效率

