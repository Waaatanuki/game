# Game

一个基于 Vue 3 + Vite 8 + TypeScript 的浏览器小游戏合集，当前包含五子棋、跳棋、数独、井字棋四款游戏。项目同时支持本地游玩、部分游戏的人机对战，以及基于 WebRTC 的点对点联机。

## 当前内容

- 五子棋：15×15 棋盘，支持人机对弈与联机对战
- 跳棋：9×9 Halma 棋盘，支持本地双人、人机对战与联机对战
- 数独：9×9 棋盘，支持难度选择、笔记、撤销、提示与错误次数限制
- 井字棋：支持本地双人、完美 Minimax AI 与联机对战

## 技术栈

- Vue 3
- Vite 8
- TypeScript
- Vue Router
- [Animal Island Vue](https://github.com/guokaigdg/animal-island-vue) 1.6（按钮、卡片、标签、表单与通知）
- UnoCSS
- PeerJS / WebRTC
- Antfu ESLint Flat Config

## 本地开发

```bash
pnpm install
pnpm dev
```

默认启动 Vite 开发服务器；配置中已开启局域网监听，可直接在同一网络内的其他设备访问。

## 常用命令

```bash
pnpm dev
pnpm build
pnpm typecheck
pnpm lint
pnpm lint:fix
pnpm up
```

## 界面组件

- 组件按页面显式导入，样式统一在 `src/main.ts` 引入 `animal-island-vue/style`
- 大厅使用 Animal Island `Background`、`Title` 和 `Icon`，搭配 `IslandScene` 小岛明信片与 `GamePreview` 棋盘预览
- `GamePageHeader` 统一游戏页的动物徽章与便签标题；`GamePanel` 为 Card 添加统一页头，`OnlineRoomPanel` 复用房间表单与连接状态
- `NotificationContainer` 在应用根节点挂载，页面通过 `Notification` 显示反馈
- 保留浅色、深色和跟随系统三种主题；组件库深色适配集中在 `src/styles/animal-island.css`
- 首次运行类型检查前先执行 `pnpm build`，生成自动导入声明

## 联机说明

- 联机能力通过 PeerJS 封装 WebRTC 直连实现
- 当前使用公共信令服务与 STUN 服务器，无需自建房间服务端
- 创建房间后会生成 6 位房号，另一方输入房号即可加入
- 若网络环境限制点对点连接，联机可能失败

## 部署说明

项目在 GitHub Pages 场景下会自动使用仓库名作为基础路径。构建 GitHub Pages 版本时可执行：

```bash
GITHUB_PAGES=true pnpm build
```

## 目录说明

- src/views：各个游戏页面与首页
- src/games：各游戏逻辑与大厅注册表
- src/composables：主题与 WebRTC 等复用逻辑
- types：自动导入与组件声明文件
