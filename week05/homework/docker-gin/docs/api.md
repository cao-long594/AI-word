# API 接口文档



## 通用说明

- 基础前缀：`/api`
- 响应格式统一为 JSON
- 除注册、登录外，其余单词本接口都需要 JWT 鉴权

### 成功响应格式

```json
{
  "code": 0,
  "msg": "success",
  "data": {}
}
```

### 失败响应格式

```json
{
  "code": 400,
  "msg": "invalid params",
  "data": null
}
```

说明：

- `code` 与 HTTP 状态码保持一致
- `msg` 为接口返回的错误说明
- `data` 在失败时固定为 `null`

### 鉴权方式

需要登录的接口必须在请求头中携带：

```http
Authorization: Bearer <token>
```

如果认证失败，常见返回如下：

- `401 missing Authorization header`：未携带认证头
- `401 invalid Authorization format`：请求头格式不是 `Bearer <token>`
- `401 invalid or expired token`：Token 无效或已过期

## 1. 用户注册

- 接口路径：`/api/auth/register`
- 请求方法：`POST`
- 是否鉴权：否
- 接口说明：注册新用户，密码会在后端使用 bcrypt 哈希后存储

### 请求体

```json
{
  "username": "alice",
  "password": "123456"
}
```

### 参数说明

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `username` | `string` | 是 | 用户名，最少 3 位，最长 64 位 |
| `password` | `string` | 是 | 登录密码，最少 6 位，最长 64 位 |

### 成功响应示例

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "id": 1,
    "username": "alice"
  }
}
```

### 失败响应及含义

| HTTP 状态码 | `msg` 示例 | 含义 |
| --- | --- | --- |
| `400` | `invalid params: ...` | 请求体缺少字段，或长度不满足校验规则 |
| `400` | `username already exists` | 用户名已被注册 |
| `500` | `register failed` | 服务端创建用户失败 |

## 2. 用户登录

- 接口路径：`/api/auth/login`
- 请求方法：`POST`
- 是否鉴权：否
- 接口说明：登录成功后返回 JWT Token，后续受保护接口通过 `Authorization` 请求头携带

### 请求体

```json
{
  "username": "alice",
  "password": "123456"
}
```

### 参数说明

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `username` | `string` | 是 | 用户名 |
| `password` | `string` | 是 | 登录密码 |

### 成功响应示例

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "token": "jwt-token",
    "user_id": 1,
    "username": "alice"
  }
}
```

### 失败响应及含义

| HTTP 状态码 | `msg` 示例 | 含义 |
| --- | --- | --- |
| `400` | `invalid params: ...` | 请求体缺少必要字段 |
| `401` | `username or password error` | 用户名不存在或密码错误 |
| `500` | `login failed` | 服务端登录处理失败 |

## 3. 智能查询单词

- 接口路径：`/api/words/query`
- 请求方法：`POST`
- 是否鉴权：是
- 接口说明：
  - 先按当前用户查询数据库中是否已有该单词
  - 如果已保存，直接返回数据库记录
  - 如果未保存，调用 AI 接口返回释义和例句，但不会自动入库

### 请求头

```http
Authorization: Bearer <token>
Content-Type: application/json
```

### 请求体

```json
{
  "word": "apple",
  "ai_provider": "deepseek"
}
```

### 参数说明

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `word` | `string` | 是 | 要查询的单词，后端会去除首尾空格并转成小写 |
| `ai_provider` | `string` | 是 | AI 提供方，目前支持 `deepseek` 和 `qwen` |

### 成功响应示例

数据库命中时：

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "source": "db",
    "saved": true,
    "word": {
      "id": 1,
      "user_id": 1,
      "word": "apple",
      "meaning": "苹果；苹果公司",
      "examples": [
        "I eat an apple every morning.",
        "This apple tastes sweet.",
        "She bought two red apples."
      ],
      "ai_provider": "deepseek",
      "created_at": "2026-04-20T10:00:00Z",
      "updated_at": "2026-04-20T10:00:00Z"
    }
  }
}
```

AI 查询时：

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "source": "ai",
    "saved": false,
    "word": {
      "word": "apple",
      "meaning": "苹果；苹果树的果实",
      "examples": [
        "I eat an apple every morning.",
        "The apple fell from the tree.",
        "She sliced the apple for dessert."
      ],
      "ai_provider": "deepseek"
    }
  }
}
```

### 失败响应及含义

| HTTP 状态码 | `msg` 示例 | 含义 |
| --- | --- | --- |
| `400` | `invalid params: ...` | 请求体缺少 `word` 或 `ai_provider` |
| `400` | `word cannot be empty` | `word` 去除空格后为空 |
| `401` | `missing Authorization header` | 未携带鉴权请求头 |
| `401` | `invalid Authorization format` | Authorization 格式错误 |
| `401` | `invalid or expired token` | Token 无效或过期 |
| `500` | `query AI failed: unsupported ai_provider, only support deepseek or qwen` | `ai_provider` 不受支持 |
| `500` | `query AI failed: AI API key is empty` | 未配置对应模型的 API Key |
| `500` | `query AI failed: ...` | AI 服务调用失败或返回内容解析失败 |

## 4. 手动保存单词

- 接口路径：`/api/words`
- 请求方法：`POST`
- 是否鉴权：是
- 接口说明：将前端确认后的单词结果保存到当前用户单词本中；如果该用户已保存过同名单词，则更新释义、例句和 AI 来源

### 请求头

```http
Authorization: Bearer <token>
Content-Type: application/json
```

### 请求体

```json
{
  "word": "apple",
  "meaning": "苹果；苹果树的果实",
  "examples": [
    "I eat an apple every morning.",
    "The apple fell from the tree.",
    "She sliced the apple for dessert."
  ],
  "ai_provider": "deepseek"
}
```

### 参数说明

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `word` | `string` | 是 | 单词内容，后端会去除首尾空格并转成小写 |
| `meaning` | `string` | 是 | 单词释义，后端会去除首尾空格 |
| `examples` | `string[]` | 是 | 例句数组，不能为空数组 |
| `ai_provider` | `string` | 是 | 生成该结果的 AI 提供方 |

### 成功响应示例

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "word": "apple"
  }
}
```

### 失败响应及含义

| HTTP 状态码 | `msg` 示例 | 含义 |
| --- | --- | --- |
| `400` | `invalid params: ...` | 请求体字段缺失或类型不正确 |
| `400` | `word and meaning cannot be empty` | `word` 或 `meaning` 去除空格后为空 |
| `400` | `examples cannot be empty` | `examples` 为空数组 |
| `401` | `missing Authorization header` | 未携带鉴权请求头 |
| `401` | `invalid Authorization format` | Authorization 格式错误 |
| `401` | `invalid or expired token` | Token 无效或过期 |
| `500` | `save word failed` | 保存或更新单词失败 |

## 5. 获取单词本分页列表

- 接口路径：`/api/words`
- 请求方法：`GET`
- 是否鉴权：是
- 接口说明：分页查询当前登录用户的单词本，按创建时间倒序返回

### 查询参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| `page` | `int` | 否 | `1` | 页码，小于 1 时按 1 处理 |
| `page_size` | `int` | 否 | `10` | 每页条数，小于 1 或大于 100 时按 10 处理 |

### 请求示例

```http
GET /api/words?page=1&page_size=5
Authorization: Bearer <token>
```

### 成功响应示例

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "user_id": 1,
        "word": "apple",
        "meaning": "苹果；苹果树的果实",
        "examples": [
          "I eat an apple every morning.",
          "The apple fell from the tree.",
          "She sliced the apple for dessert."
        ],
        "ai_provider": "deepseek",
        "created_at": "2026-04-20T10:00:00Z",
        "updated_at": "2026-04-20T10:05:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "page_size": 5
  }
}
```

### 失败响应及含义

| HTTP 状态码 | `msg` 示例 | 含义 |
| --- | --- | --- |
| `401` | `missing Authorization header` | 未携带鉴权请求头 |
| `401` | `invalid Authorization format` | Authorization 格式错误 |
| `401` | `invalid or expired token` | Token 无效或过期 |
| `500` | `list words failed` | 查询单词列表失败 |

## 6. 删除单词

- 接口路径：`/api/words/:id`
- 请求方法：`DELETE`
- 是否鉴权：是
- 接口说明：按单词记录 ID 删除当前用户自己的单词记录；当前实现为软删除

### 路径参数

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | `int64` | 是 | 要删除的单词记录 ID |

### 请求示例

```http
DELETE /api/words/1
Authorization: Bearer <token>
```

### 成功响应示例

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "id": 1
  }
}
```

### 失败响应及含义

| HTTP 状态码 | `msg` 示例 | 含义 |
| --- | --- | --- |
| `400` | `invalid word id` | 路径参数 `id` 不是合法整数 |
| `401` | `missing Authorization header` | 未携带鉴权请求头 |
| `401` | `invalid Authorization format` | Authorization 格式错误 |
| `401` | `invalid or expired token` | Token 无效或过期 |
| `404` | `word not found` | 当前用户下不存在该单词记录 |
| `500` | `delete word failed` | 删除操作失败 |

## 错误码说明

| `code` | 含义 |
| --- | --- |
| `0` | 请求成功 |
| `400` | 请求参数错误 |
| `401` | 未登录、Token 无效、Token 过期或鉴权格式错误 |
| `404` | 目标资源不存在 |
| `500` | 服务端内部错误 |
