# 个人知识库

基于 Next.js 的本地优先笔记与标签管理，支持 URL / 文本 AI 摘要（百度千帆）。

## 本地运行

```bash
npm install
cp .env.example .env.local
# 编辑 .env.local，填入百度 API Key 与 Secret Key
npm run dev
```

浏览器访问 <http://localhost:3000>。

## 默认笔记与作者简介 PDF

- 首次加载的示例笔记由 `lib/default-seed-notes.ts` 定义；其中「从微信创建的笔记」长文由 `public/seeds/wechat-body-part*.raw` 拼接，运行 `npm run seed:wechat` 可重新生成 `lib/seed-wechat-generated.ts`。
- 「作者简介」附件路径：`public/author-profile-xierunqian.pdf`（由桌面 PDF 复制而来；若需更新，可替换该文件后保持文件名或同步修改 `default-seed-notes.ts` 中的 `sourceUrl`）。

## 开始页与新手引导

- **开始页**：首次进入点「即刻开始 / 跳过」后，会写入 `localStorage` 键 `buluohui-welcome-dismissed`，之后同一浏览器不再显示。若要再次体验，在开发者工具控制台执行：  
  `localStorage.removeItem('buluohui-welcome-dismissed')` 后刷新。
- **新手引导**：完成后写入 `buluohui-onboarding-completed`。清除：  
  `localStorage.removeItem('buluohui-onboarding-completed')` 后刷新（需已看过开始页或已清除上一项）。

## 环境变量

见 `.env.example`。密钥仅放在 `.env.local`（已被 `.gitignore` 忽略）。

## 构建

```bash
npm run build
npm start
```
