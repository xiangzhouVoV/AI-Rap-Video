# AI-Rap-Video

面向美国市场的 airaptovideo 响应式网站，使用 Next.js App Router、React、TypeScript。页面正文预渲染为完整 HTML，上传和生成使用 Node.js 服务端接口。

## 本地运行

```sh
npm ci
cp .env.example .env.local
npm run dev
```

打开 http://localhost:3000 。`.env.local` 中的 `APP_ORIGIN` 必须与浏览器使用的地址和端口完全一致。

```sh
npm run typecheck
npm test
npm run build
npm start
npm run metrics
```

测试使用独立临时服务、合成图片与本地模拟视频服务，不消耗生成费用。`npm run metrics -- 2026-10-24` 可指定统计开始时间；默认最近七天，只输出上传率、真实生成成功率和付款弹窗点击率及其分母。没有真实数据时比率为 `null`。

## Cloudflare Workers 部署

使用 Node.js 24（见 `.nvmrc`）。仓库固定 OpenNext 和 Wrangler 版本，`npm run build` 使用 Webpack，避免当前 Next.js 16.4.3 的 Turbopack 外部依赖名称（如 `sharp-<hash>`）导致 OpenNext 打包失败。开发服务器仍使用 Next.js 默认构建器。

Cloudflare Workers Builds 配置：

- 根目录：仓库根目录。
- 构建命令：留空。
- 部署命令：`npx wrangler deploy`（也可使用 `npm run deploy`）。
- 构建环境设置正式域名的 `APP_ORIGIN`、`NEXT_PUBLIC_SITE_URL`；不要设置本地代理 `AUTH_BACKEND_URL`。

`wrangler.jsonc` 的 `build.command` 会调用 `npm run cf:build`，完成 Next.js 编译和 OpenNext 转换，再部署 `.open-next/worker.js` 和 `.open-next/assets`。不再依赖部署过程中临时执行迁移。当前没有配置 ISR/R2 缓存；后续使用动态缓存时需单独接入。

本地验证：

```sh
npm ci
npm run cf:check  # 构建并进行 Wrangler dry-run，不发布
npm run preview   # 构建并以 Workers 运行时在 8788 端口预览
```

**当前上线范围与限制：**这份配置解决前端页面的 Workers 构建和运行。Google 登录仍需要独立后端、D1、OAuth 配置及 `/api/auth/*`、`/api/me` 的生产路由。现有上传/生成/事件等演示接口按 Node.js 服务实现：上传依赖原生 `sharp`，图片、任务和用量存储依赖本地 `.data` 与文件锁；这些接口尚不适用于 Workers，不能因构建成功而视为可用。后续需在独立后端接入 R2/D1，并替换图片处理能力。`next/image` 的 Images binding 不会自动替代业务接口中的 `sharp` 调用。

## 已实现

- 首页、根级 I Found You 热梗页、全部 P1/P2 页面与 `/effects/` 目录；唯一页面关键词、canonical、sitemap、robots、viewport 和首页内链。
- 首页三种原地选择的风格、热梗跳转、四种热梗变体、三步说明、竞品表、5/12 条 FAQ。
- 相册、拍照、拖放上传；服务端校验 JPEG/PNG/WebP/HEIC/HEIF、自动旋转、去除原始元数据并转换成 JPEG。
- 生成进度、实际保存邮箱、成功结果、高清无水印下载触发的积分包弹窗、失败和重试。
- Rap name generator 在浏览器中生成与复制名字。
- 私有上传存储、会话隔离、请求校验、限流、持久化任务、三个验收指标与成本上限检查。

## 服务接入状态

当前默认是明确标注的**演示模式**：上传真实处理，生成展示本地五秒无声样片，照片不会用于生成该样片。样片可下载；积分包可查看，演示不收款，也不伪造积分扣款或退款。邮箱只保存，不发送通知。

视频和支付服务尚未确定。已定义可配置的 adapter 接口，见 [服务端 API 与接入契约](docs/api.md)。视频服务接入后可启用首次免费生成；付费需继续接入已确认的积分数量、真实支付通知、积分账本和高清无水印交付，不能仅填支付 URL 就视为完成上线。

本地存储位于 gitignored 的 `.data/`。此适配器适用于有持久磁盘的单机 Node 服务；部署到无状态平台前需替换存储。不要将上传目录设在 `public/` 中。生产域名通过 `APP_ORIGIN` 和 `NEXT_PUBLIC_SITE_URL` 配置，默认 `INDEXABLE=false`；正式服务准备好后再设置为 `true` 并重新构建。

## 项目文档

- [背景与页面框架需求 v2.1](docs/requirements-v2.1.md)：初版需求基线，记录于 2026-10-24。
- [服务端 API 与接入契约](docs/api.md)
- [视觉素材来源](docs/assets.md)


## Google 登录与独立后端

认证由同级 `../AI-Rap-Video-Server` 的 Cloudflare Worker 提供，前端使用 Better Auth React 客户端。导航栏支持 Google 登录、查看当前用户和退出；授权取消或失败后回到 `/login`，可重试。登录成功返回原来的站内页面，包含查询参数和锚点。

本地先按照后端 README 配置 Google OAuth、`BETTER_AUTH_SECRET` 和本地 D1 迁移，并启动后端。前端 `.env.local` 配置：

```dotenv
APP_ORIGIN=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
AUTH_BACKEND_URL=http://127.0.0.1:8787
```

随后运行 `npm run dev`，浏览器固定访问 `http://localhost:3000`。后端 `BETTER_AUTH_URL` 同样设为 `http://localhost:3000`，Google Authorized redirect URI 为 `http://localhost:3000/api/auth/callback/google`。不要混用 `localhost` 与 `127.0.0.1`，Cookie 和 OAuth 请求来源需保持一致。

Next.js 只将 `/api/auth/*` 和 `/api/me` 代理到独立后端，其余现有上传与生成接口保持原流程。本次新增登录尚未将演示上传/生成记录迁移为 Google 用户所有，不代表后续生成鉴权已经完成。

生产环境移除 `AUTH_BACKEND_URL`，在 Cloudflare 把 `/api/auth/*` 和 `/api/me` 路由到后端 Worker，并让后端 `BETTER_AUTH_URL`、Google 回调地址使用同一个正式 HTTPS 域名。认证响应不能被缓存，路由必须保留 Cookie、所有 Set-Cookie 和重定向响应。Google Client Secret 和 Better Auth Secret 只配置在后端，不能使用 `NEXT_PUBLIC_*` 或提交到仓库。

验证：`npm run typecheck`、`npx tsx --test tests/auth-redirect.test.ts`、`npm run build`。真实 Google 授权需要有效的 OAuth 配置，并实际验证登录回跳、刷新保持登录和退出失效。
