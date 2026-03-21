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

## 环境变量

见 `.env.example`。密钥仅放在 `.env.local`（已被 `.gitignore` 忽略）。

## 构建

```bash
npm run build
npm start
```
