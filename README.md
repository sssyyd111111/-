# 🧠 个人知识库 (Personal Knowledge Base)

https://buluhu-3fwsrbt34-sssyyd111111s-projects.vercel.app

**基于 Next.js 的本地优先笔记与标签管理系统，内置 Impeccable 设计规范。**

[](https://nextjs.org/)
[](https://github.com/pbakaus/impeccable)
[](https://cloud.baidu.com/product/wenxinworkshop)

## ✨ 项目亮点

  * **⚡ 极速启动**：自动计算笔记预计阅读时间，优先推荐短内容，从微小的胜利中获得动力。
  * **🤖 智能摘要**：输入网址或上传文档，AI 自动提取核心观点，告别“只藏不读”。
  * **🌟 灵感唤醒**：标记为“灵感”的内容会定期回访，通过跨越时空的对话激发新的火花。
  * **📱 多端同步**：支持微信服务号一键转发，随时随地捕捉碎片化思绪。

## 🚀 快速开始

### 1\. 克隆与安装

```bash
git clone <your-repo-url>
cd personal-knowledge-base
npm install
```

### 2\. 配置环境变量

将 `.env.example` 复制为 `.env.local`，并填入你的 API 密钥：

```bash
# 百度千帆 API 配置
BAIDU_API_KEY=your_api_key
BAIDU_SECRET_KEY=your_secret_key
```

### 3\. 本地开发

```bash
npm run dev
```

访问 [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) 查看效果。

## 📖 新手引导

首次进入页面将自动触发 **Interactive Onboarding**：

1.  **智能捕捉**：尝试在输入框粘贴一个网址。
2.  **启动力**：观察列表顶部的阅读时长标注。
3.  **内化**：点击笔记卡片，尝试标记“灵感”或“已消化”。
4.  **联动**：扫描页面下方的二维码绑定微信。

## 🛠️ 技术栈

  * **框架**: Next.js 14 (App Router)
  * **样式**: Tailwind CSS + Impeccable Design System
  * **动画**: Framer Motion
  * **AI**: 百度千帆大模型 / Claude 3.5 (via Cursor)
  * **部署**: Vercel
