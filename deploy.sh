#!/usr/bin/env bash
set -euo pipefail

# ========= 配置 =========
PROJECT_DIR="/home/ubuntu/me"      # 前端项目根目录
BUILD_CMD="pnpm build"             # 构建命令
INSTALL_CMD="pnpm install --frozen-lockfile"     # 安装依赖命令
NODE_OPTIONS_MAX_OLD_SPACE="2048"  # 构建内存上限（MB）
GIT_BRANCH="master"

# ★ 部署唯一事实源（2026-08-13 修订，替代 nginx 时代旧版）：
#   线上 longsizhuo.com 由 Caddy 容器（global-caddy-gateway）托管。
#   Caddyfile: root * /srv/longsizhuo，容器 bind mount 宿主 /home/ubuntu/me/dist → /srv/longsizhuo (ro)。
#   ⇒ 构建产物 dist/ 本身就是部署目录：`pnpm build` 完成后 Caddy 自动可见，无需 rsync、无需 nginx。
#   ⚠️ 旧版 deploy.sh 同步到 /var/www/longsizhuo.com + `systemctl reload nginx`——那是 nginx
#   时代的遗留，nginx 已不在跑，照旧脚本会把产物同步到 Caddy 根本不读的目录 → 线上不更新，
#   且 Agent 按文档找 /var/www 会找不到东西。任何改动请以本文件头部注释为准。

# ========= 日志工具 =========
log()  { printf "\033[1;36m%s\033[0m %s\n" "==>" "$*"; }
warn() { printf "\033[1;33m%s\033[0m %s\n" "WARN:" "$*"; }
die()  { printf "\033[1;31m%s\033[0m %s\n" "ERROR:" "$*" >&2; exit 1; }
need() { command -v "$1" >/dev/null 2>&1; }

# ========= 预检查 =========
need pnpm  || die "未找到 pnpm，请先安装（curl -fsSL https://get.pnpm.io/install.sh | sh -）"
need git   || die "未找到 git"
cd "$PROJECT_DIR"

# ========= 同步远端（安全版：绝不覆盖未提交改动） =========
log "同步远端 ${GIT_BRANCH} ..."
git fetch origin
if ! git diff --quiet --exit-code; then
    warn "本地存在未提交改动（deploy 拒绝覆盖）："
    git status --short | head -20
    die "请先提交或 stash 本地改动，再运行部署"
fi
if ! git diff --quiet --cached --exit-code; then
    warn "本地存在已暂存未提交的改动（deploy 拒绝覆盖）："
    git status --short | head -20
    die "请先提交或 stash 本地改动，再运行部署"
fi

# ========= 安装依赖 + 构建 =========
log "安装依赖..."
$INSTALL_CMD

log "构建前端（Node --max-old-space-size=$NODE_OPTIONS_MAX_OLD_SPACE）..."
export NODE_OPTIONS="--max-old-space-size=${NODE_OPTIONS_MAX_OLD_SPACE}"
$BUILD_CMD

BUILD_DIR="$PROJECT_DIR/dist"
[ -d "$BUILD_DIR" ] || die "构建目录不存在：$BUILD_DIR（请确认构建是否成功）"

# ========= 部署 =========
# Caddy 容器挂载 dist/ 为 /srv/longsizhuo（ro），构建完成即线上可见，无需额外同步。
HASH_JS=$(ls -1 "$BUILD_DIR"/assets/*.js 2>/dev/null | sed 's|.*/||' | sort -u | paste -sd "," - || true)
log "✅ 构建完成，Caddy 已挂载 dist/（自动可见）： https://longsizhuo.com/"
log "   JS 资源：${HASH_JS:-(未找到 assets/*.js)}"
log "   验证： curl -s https://longsizhuo.com/ | grep -Eo 'assets/[^\"[:space:]]+\.js' | sort -u"
