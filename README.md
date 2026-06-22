# ConfigOps Hub

<div align="center">

**中小团队的配置中心 + 私有包仓库 + 变更审计，三合一开源平台。**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/alexlishiyi-lgtm/configops-hub?style=social)](https://github.com/alexlishiyi-lgtm/configops-hub)

[在线演示](https://configops.dev) · [文档](./docs) · [问题反馈](https://github.com/alexlishiyi-lgtm/configops-hub/issues)

</div>

---

## ✨ 功能特性

| 模块 | 说明 |
|------|------|
| 🔧 **配置中心** | 多环境配置管理，SDK 实时拉取，ETag 缓存，版本历史与回滚 |
| 📦 **私有包仓库** | npm Registry 兼容，支持私有包发布与代理公网包 |
| 🔍 **变更审计** | 全量操作日志，Webhook 通知，谁改了什么一目了然 |
| 💳 **计费系统** | 多计划订阅（免费/专业/团队），用量统计，Stripe 集成 |
| 🔐 **安全认证** | Auth.js v5，GitHub OAuth + 邮箱密码，API Key 管理 |

---

## 🚀 快速开始

### 前置依赖

- Node.js 22+
- PostgreSQL 16+
- Redis 7+
- pnpm 11+

### 本地开发

```bash
# 1. Clone 项目
git clone https://github.com/alexlishiyi-lgtm/configops-hub.git
cd configops-hub

# 2. 安装依赖
pnpm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env，填入数据库连接等信息

# 4. 启动数据库（需要 Docker）
docker compose -f docker-compose.dev.yml up -d

# 5. 生成 Prisma Client 并迁移数据库
pnpm prisma:generate
pnpm prisma:migrate

# 6. 插入种子数据
pnpm prisma:seed

# 7. 启动开发服务器
pnpm dev
```

访问 **http://localhost:3002** 🎉

### 演示账号

| 邮箱 | 密码 | 角色 |
|------|------|------|
| demo@configops.dev | test123456 | ADMIN |
| dev@configops.dev | test123456 | DEVELOPER |

---

## 📦 SDK 接入

### Node.js

```typescript
import { ConfigOps } from '@configops/node-sdk'

const config = new ConfigOps({
  apiKey: 'cop_你的密钥',
  env: 'DEV'
})

await config.load()
console.log(config.get('database.host'))
```

### Python

```python
from configops import ConfigOps

config = ConfigOps(api_key="cop_你的密钥", env="DEV")
config.load()
print(config.get("database.host"))
```

---

## 🗂️ 项目结构

```
configops-hub/
├── apps/web/              # Next.js 主应用
│   ├── src/
│   │   ├── app/          # 页面路由 (App Router)
│   │   ├── components/    # React 组件
│   │   ├── lib/           # 工具库 (db, auth, utils)
│   │   └── types/         # TypeScript 类型
│   └── prisma/            # 数据库 Schema + 迁移
├── sdks/                   # 官方 SDK
│   ├── node/              # Node.js SDK
│   └── python/            # Python SDK
├── docker-compose.dev.yml  # 本地开发数据库
└── pnpm-workspace.yaml
```

---

## ⚙️ 环境变量说明

参考 `.env.example`，主要配置：

| 变量 | 说明 | 必填 |
|------|------|------|
| `DATABASE_URL` | PostgreSQL 连接串 | ✅ |
| `REDIS_URL` | Redis 连接串 | ✅ |
| `AUTH_SECRET` | Auth.js 加密密钥 | ✅ |
| `AUTH_URL` | 认证回调地址 | ✅ |
| `GITHUB_ID` / `GITHUB_SECRET` | GitHub OAuth | ⭕️ |
| `STRIPE_SECRET_KEY` | Stripe 密钥 | ⭕️ |
| `OSS_*` | 阿里云 OSS（包仓库用） | ⭕️ |

---

## 🛠️ 技术栈

- **前端**: Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4
- **后端**: Next.js API Routes + Prisma 7 + PostgreSQL 16
- **认证**: Auth.js v5 (NextAuth)
- **缓存**: Redis 7
- **部署**: Vercel + Docker

---

## 🤝 贡献指南

欢迎 PR！请先 Fork 本仓库，创建你的特性分支：

```bash
git checkout -b feat/your-feature
git commit -m "feat: 描述你的改动"
git push origin feat/your-feature
```

然后提交 Pull Request 🙏

---

## 📄 开源协议

[MIT License](LICENSE) — 可自由使用、修改、分发。

---

## ⭐ Star History

如果这个项目对你有帮助，欢迎点个 Star ⭐️

---

## 📮 联系我

- GitHub Issues: [提交问题](https://github.com/alexlishiyi-lgtm/configops-hub/issues)
- 邮箱: alexlishiyi.lgtm@gmail.com

---

<div align="center">
  Built with ❤️ by <a href="https://github.com/alexlishiyi-lgtm">alexlishiyi-lgtm</a>
</div>
