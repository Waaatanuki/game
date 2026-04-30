# game

基于 Vite 8、Vue 3、TypeScript 与 Element Plus 初始化的前端项目，已接入 Antfu ESLint 规则、路径别名和自动导入能力。

## 已接入能力

- Vite 8 + Vue 3 + TypeScript
- Element Plus 按需解析
- Vue API 自动导入
- Vue 组件自动注册
- @ 指向 src 的路径别名
- Antfu Flat ESLint 配置

## 常用命令

```bash
pnpm dev
pnpm typecheck
pnpm lint
pnpm lint:fix
pnpm build
```

## 说明

自动导入声明文件位于项目根目录的 auto-imports.d.ts 与 components.d.ts。
