# 贡献指南

感谢你考虑为 **ConfigOps Hub** 做出贡献！🙏

---

## 🚀 快速开始

### 1. Fork & Clone

```bash
# Fork 本仓库后，Clone 你的 Fork
git clone https://github.com/你的用户名/configops-hub.git
cd configops-hub

# 添加上游仓库
git remote add upstream https://github.com/alexlishiyi-lgtm/configops-hub.git
```

### 2. 安装依赖

```bash
pnpm install
cp .env.example .env
# 编辑 .env 填入本地数据库信息
pnpm prisma:generate
pnpm prisma:migrate
pnpm dev
```

---

## 🌿 分支规范

| 分支类型 | 前缀 | 示例 |
|----------|------|------|
| 新功能 | `feat/` | `feat/add-ldap-auth` |
| Bug 修复 | `fix/` | `fix/config-rollback-null` |
| 文档 | `docs/` | `docs/api-guide` |
| 重构 | `refactor/` | `refactor/sdk-retry` |
| 性能 | `perf/` | `perf/config-cache` |

---

## 📝 提交信息规范

请使用 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

```
<类型>(<范围>): <描述>
```

**类型说明：**

| 类型 | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档变更 |
| `style` | 代码格式（不影响功能） |
| `refactor` | 重构（非 feat/fix） |
| `perf` | 性能优化 |
| `test` | 测试相关 |
| `chore` | 构建/工具链变更 |

**示例：**

```bash
feat(config): 支持 JSON Schema 校验
fix(auth): 修复 OAuth 回调地址错误
docs(sdk): 补充 Node.js SDK 使用示例
```

---

## ✅ Pull Request 流程

1. **创建功能分支**
   ```bash
   git checkout -b feat/your-feature
   ```

2. **开发并提交**
   ```bash
   git add .
   git commit -m "feat: 描述你的改动"
   ```

3. **保持与上游同步**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

4. **推送并创建 PR**
   ```bash
   git push origin feat/your-feature
   ```
   然后在 GitHub 上创建 Pull Request。

5. **PR 描述模板**
   ```markdown
   ## 改动说明
   - 简述改了什么

   ## 改动类型
   - [ ] 新功能
   - [ ] Bug 修复
   - [ ] 文档
   - [ ] 重构

   ## 测试
   - 如何测试这些改动

   ## 截图（如有）
   ```

---

## 🐛 报告 Bug

请在 [Issues](https://github.com/alexlishiyi-lgtm/configops-hub/issues) 页面创建 Bug 报告，并包含：

- 复现步骤
- 预期行为 vs 实际行为
- 环境信息（浏览器、OS、Node 版本）
- 相关截图或日志

---

## 💡 提出新功能

也请在 Issues 提出，标签选 **enhancement**，描述：

- 功能的使用场景
- 期望的行为
- 是否愿意来实现它

---

## 📏 代码规范

- TypeScript：严格模式，无 `any`
- 组件：函数式 + Hooks
- 样式：Tailwind CSS，不使用内联样式
- 文件路径：使用 `@/` 别名

---

## 📄 License

贡献者同意其贡献将以 MIT License 分发。

---

再次感谢你的贡献！❤️
