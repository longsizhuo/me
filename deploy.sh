#!/usr/bin/env bash
set -euo pipefail

# ========= 配置 =========
PROJECT_DIR="/home/ubuntu/Project_longs/me"      # 前端项目根目录
ASSET_ROOT_REL="src/assets/album"                # 递归扫描 HEIC 的资源目录（相对 PROJECT_DIR）
BUILD_CMD="pnpm build"                           # 构建命令
INSTALL_CMD="pnpm install --frozen-lockfile"     # 安装依赖命令
NODE_OPTIONS_MAX_OLD_SPACE="2048"                # 构建内存上限（MB）
NGINX_SITE_ROOT="/var/www/longsizhuo.com"        # ★ Nginx root 不变
OWNER="www-data:www-data"                        # 目标目录属主
NGINX_SERVICE="nginx"                            # Nginx 服务名
GIT_BRANCH="master"

# ========= 日志工具 =========
log()  { printf "\033[1;36m%s\033[0m %s\n" "==>" "$*"; }
warn() { printf "\033[1;33m%s\033[0m %s\n" "WARN:" "$*"; }
die()  { printf "\033[1;31m%s\033[0m %s\n" "ERROR:" "$*" >&2; exit 1; }
need() { command -v "$1" >/dev/null 2>&1; }

# ========= 预检查 =========
need pnpm  || die "未找到 pnpm，请先安装（curl -fsSL https://get.pnpm.io/install.sh | sh -）"
need rsync || die "未找到 rsync，请先安装（sudo apt-get install -y rsync）"
[ -d "$PROJECT_DIR" ]      || die "PROJECT_DIR 不存在：$PROJECT_DIR"
[ -d "$NGINX_SITE_ROOT" ] || sudo mkdir -p "$NGINX_SITE_ROOT"

ASSET_ROOT="$PROJECT_DIR/$ASSET_ROOT_REL"
[ -d "$ASSET_ROOT" ] || warn "资源目录不存在：$ASSET_ROOT（将跳过 HEIC 转换）"
 
# ========= 开始 =========
log "切换到项目目录: $PROJECT_DIR"
cd "$PROJECT_DIR"

# 强制覆盖本地：包含未跟踪文件的清理，避免 pull 冲突
log "获取最新代码（覆盖本地改动与未跟踪文件）..."
git fetch origin
git reset --hard "origin/${GIT_BRANCH}"
git clean -fd      # 保留 .gitignore 忽略的文件；若连忽略文件也要删，用 git clean -fdx

log "安装依赖..."
$INSTALL_CMD

log "构建前端（Node --max-old-space-size=$NODE_OPTIONS_MAX_OLD_SPACE）..."
export NODE_OPTIONS="--max-old-space-size=${NODE_OPTIONS_MAX_OLD_SPACE}"
$BUILD_CMD

# Vite/React 一般构建到 dist
BUILD_DIR="$PROJECT_DIR/dist"
[ -d "$BUILD_DIR" ] || die "构建目录不存在：$BUILD_DIR（请确认构建是否成功）"

# ========= 同步到 Nginx 根目录 =========
log "同步产物到 $NGINX_SITE_ROOT（增量 + 删除多余）"
sudo rsync -aH --delete "$BUILD_DIR"/ "$NGINX_SITE_ROOT"/

log "设置权限 $OWNER"
sudo chown -R "$OWNER" "$NGINX_SITE_ROOT"

# ========= 校验并 reload Nginx =========
log "校验 Nginx 配置"
sudo nginx -t

log "重载 Nginx"
sudo systemctl reload "$NGINX_SERVICE"

# ========= 打印版本信息（便于核对）=========
HASH_JS=$(ls -1 "$NGINX_SITE_ROOT"/assets/*.js 2>/dev/null | sed 's|.*/||' | sort -u | paste -sd "," - || true)
log "已部署的 JS 资源：${HASH_JS:-"(未找到 assets/*.js)"}"

log "✅ 部署完成： https://longsizhuo.com/"
log "🧪 验证首页引用资源： curl -s https://longsizhuo.com/ | grep -Eo 'assets/[^\"[:space:]]+\\.js' | sort -u"
