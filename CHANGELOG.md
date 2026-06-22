# Changelog

所有项目重要变更都会记录在本文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

## [Unreleased]

### 计划中
- [ ] 接入国内聚合支付（支付宝/微信）
- [ ] OAuth 增加 GitLab / Google 登录
- [ ] 配置 Diff 可视化对比
- [ ] SDK 增加 Go / Java 版本

---

## [0.1.0] - 2026-06-22

### ✨ 新增
- **Sprint 1**：项目初始化，Next.js 16 + React 19 + TypeScript + Tailwind CSS v4
- **Sprint 1**：Auth.js v5 认证系统，GitHub OAuth + 邮箱密码登录
- **Sprint 1**：CI/CD 基础配置（GitHub Actions）
- **Sprint 2**：多租户架构，Workspace + Member 模型
- **Sprint 2**：配置 CRUD API + 多环境（DEV/TEST/PROD）支持
- **Sprint 2**：配置中心 UI，列表 + 编辑器 + 空状态引导
- **Sprint 2**：成员管理，角色权限（ADMIN/DEVELOPER/VIEWER）
- **Sprint 2**：动态仪表盘，统计卡片 + 最近活动
- **Sprint 3**：SDK 配置拉取端点，ETag 缓存 + 304 响应
- **Sprint 3**：API Key 管理，SHA-256 哈希存储 + 吊销机制
- **Sprint 3**：Webhook 通知，6 种事件 + HMAC-SHA256 签名
- **Sprint 3**：Node.js SDK + Python SDK
- **Sprint 4**：包仓库 CRUD API + 交互式 UI
- **Sprint 4**：npm Registry 兼容 API（ping/whoami/install/publish/login）
- **Sprint 4**：公共包代理 npmjs.org
- **Sprint 5**：配置回滚 API
- **Sprint 5**：版本历史时间线 UI（展开/回滚/确认）
- **Sprint 6**：Stripe 计费 API（checkout/portal/webhook/subscription）
- **Sprint 6**：计划限制中间件（FREE/PRO/TEAM）
- **Sprint 6**：健康检查端点 `/api/health`
- **Sprint 6**：BillingTab UI（用量统计/升级）

### 🔧 修复
- 配置列表"新建配置"按钮点击无效（事件冒泡问题）
- 设置页 URL 参数读取丢失 workspaceId
- BillingTab variant 属性 TypeScript 类型错误
- Auth.js edge-config / full-config 拆分，解决 Edge Runtime 兼容

### 🔒 安全
- API Key 明文仅创建时返回，数据库存储 SHA-256 哈希
- Webhook 签名使用 HMAC-SHA256 验证
- 配置值支持加密存储标记（isEncrypted）

---

## [0.0.1] - 2026-06-01

### ✨ 新增
- 项目初始化，数据库 Schema 设计
- Prisma 7 + PostgreSQL 16 集成
- Docker Compose 本地开发环境

---

## 版本说明

| 版本号段 | 含义 |
|----------|------|
| **主版本** | 不兼容的 API 变更 |
| **次版本** | 向后兼容的新功能 |
| **修订号** | 向后兼容的 Bug 修复 |

---

_本 Changelog 随每次发布更新，记录所有值得用户知晓的变更。_
