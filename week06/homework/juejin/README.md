# jue2

掘金课程页复刻作业，技术栈为 `Webpack + React + TypeScript + Tailwind CSS`。

## 启动

```bash
npm install
npm run dev
```

默认走 webpack 代理到 `https://api.juejin.cn`。

## 使用 whistle(8899)

如果你已开启 whistle 并监听 `8899`：

```bash
npm run dev:whistle
```

## 工程化

- `npm run lint`：ESLint 检查
- `npm run typecheck`：TS 类型检查
- `npm run build`：生产构建
- `npm run format`：Prettier 格式化

已集成：

- ESLint
- Prettier
- Husky（需在 git 仓库中执行 `npm run prepare` 生效）
- Commitlint
