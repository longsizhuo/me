# CLAUDE.md — 龙思卓个人主页 (longsizhuo.com)

本文件给 Claude Code / Codex / Hermes 等 AI 助手看。改动代码前请先读本文件。

## 项目是什么

`/home/ubuntu/me` — 个人主页源码（Vite + React + Tailwind + Three.js），
构建产物在 `dist/`，线上站点 https://longsizhuo.com

## ★ 部署唯一事实源（重要，Agent 必读）

**线上由 Caddy 容器（global-caddy-gateway）托管，不是 nginx！**

- Caddyfile：`root * /srv/longsizhuo`
- Caddy 容器 bind mount：宿主 `/home/ubuntu/me/dist` → 容器 `/srv/longsizhuo`（ro）
- **部署 = `pnpm build` 构建到 `dist/`，Caddy 自动可见，不需要 rsync、不需要 nginx**

⚠️ 不要做的事（曾经让 Agent 迷路的坑）：

- ❌ 不要 rsync 到 `/var/www/longsizhuo.com` —— nginx 时代的旧路径，Caddy 不读它
- ❌ 不要 `systemctl reload nginx` —— nginx 没在跑（是 Caddy 容器）
- ❌ 不要 `git reset --hard origin/master` —— 会静默丢弃本地未提交的改动
- ✅ 用 `bash deploy.sh` 部署（已修复：安全同步 + 构建，拒绝覆盖未提交改动）

## 常用命令

```bash
pnpm dev            # 开发服务器
pnpm build          # 构建到 dist/（= 部署，Caddy 自动可见）
bash deploy.sh      # 完整部署（同步远端 → 构建 → 提示验证）
npx tsc --noEmit    # TypeScript 类型检查
```

## 目录结构

- `src/components/` — 页面区块（Hero/About/Album/Works/Writing/Friends/Footer 等）
- `src/pages/` — 独立路由页（Album、Tools、Admin、NotFound）
- `src/i18n/` — 中英文案（zh.json / en.json）
- `src/content/` — CDN 相关工具（R2 图片）
- `src/constants/` — 导航等静态数据
- `src/hoc/` — SectionWrapper（区块动画包装器）

## 添加新页面区块的步骤

1. 在 `src/components/` 新建组件（参考 `Writing.tsx` 风格：SectionWrapper + fadeIn）
2. 在 `src/i18n/zh.json` 和 `src/i18n/en.json` 加对应文案
3. 在 `src/App.tsx` 的 `HomePage` 里插入组件
4. `npx tsc --noEmit` 检查类型
5. `pnpm build` 验证构建
6. commit + push 后跑 `bash deploy.sh` 上线
