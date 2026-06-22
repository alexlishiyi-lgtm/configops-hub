# ConfigOps Hub

中小团队的配置中心 + 私有包仓库 + 变更审计，三合一 SaaS 平台。

## 技术栈

- **前端**: Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4
- **后端**: Next.js API Routes + Prisma 7 + PostgreSQL 16
- **认证**: Auth.js v5 (NextAuth) — GitHub OAuth + 邮箱密码
- **缓存**: Redis 7 (Sprint 2+)
- **部署**: Vercel + 阿里云 ECS (Sprint 6)

## 快速开始

```bash
# 1. 安装依赖
pnpm install

# 2. 复制环境变量
cp .env.example .env
# 编辑 .env 填入数据库连接和 OAuth 凭据

# 3. 启动本地数据库 (需要 Docker)
docker compose -f docker-compose.dev.yml up -d

# 4. 生成 Prisma Client
pnpm prisma:generate

# 5. 运行数据库迁移
pnpm prisma:migrate

# 6. 插入种子数据
pnpm prisma:seed

# 7. 启动开发服务器
pnpm dev
```

访问 http://localhost:3000

## 演示账号

- 邮箱: demo@configops.dev
- 密码: test123456

## 项目结构

```
configops-hub/
├── apps/web/          # Next.js 主应用
│   ├── src/
│   │   ├── app/       # 页面路由 (App Router)
│   │   ├── components/# React 组件
│   │   ├── lib/       # 工具库 (db, auth, utils)
│   │   └── types/     # TypeScript 类型
│   └── prisma/        # 数据库 Schema + 迁移
├── sdks/              # SDK (Sprint 3)
├── docker-compose.dev.yml
└── pnpm-workspace.yaml
```

## 开发计划

- Sprint 1 (W1-W2): 项目初始化 + 认证系统
- Sprint 2 (W3-W4): 多租户 + 配置基础
- Sprint 3 (W5-W6): 配置核心 + SDK
- Sprint 4 (W7-W8): 私有包仓库
- Sprint 5 (W9-W10): 变更审计 + 回滚
- Sprint 6 (W11-W12): 计费 + 上线
