#!/usr/bin/env bash
set -euo pipefail

# ========= 配置 =========
PROJECT_DIR="/home/ubuntu/Project_longs/me"      # 你的前端项目根目录（含 package.json）
BUILD_CMD="pnpm build"                            # 构建命令
INSTALL_CMD="pnpm install --frozen-lockfile"      # 安装依赖命令
NODE_OPTIONS_MAX_OLD_SPACE="2048"                 # 构建内存上限（MB）
NGINX_SITE_ROOT="/var/www/longsizhuo.com"         # ★ Nginx root 不变
OWNER="www-data:www-data"                         # 目标目录属主
NGINX_SERVICE="nginx"                             # Nginx 服务名

# ========= 日志函数 =========
log() { printf "\033[1;36m%s\033[0m %s\n" "==>" "$*"; }
die() { printf "\033[1;31m%s\033[0m %s\n" "ERROR:" "$*" >&2; exit 1; }

# ========= 预检查 =========
command -v pnpm >/dev/null 2>&1 || die "未找到 pnpm，请先安装（curl -fsSL https://get.pnpm.io/install.sh | sh -）"
command -v rsync >/dev/null 2>&1 || die "未找到 rsync，请先安装（sudo apt-get install -y rsync）"
[ -d "$PROJECT_DIR" ] || die "PROJECT_DIR 不存在：$PROJECT_DIR"
[ -d "$NGINX_SITE_ROOT" ] || sudo mkdir -p "$NGINX_SITE_ROOT"

# ========= 开始 =========
log "切换到项目目录: $PROJECT_DIR"
cd "$PROJECT_DIR"

log "拉取代码..."
git pull --ff-only

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
