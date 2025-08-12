#!/usr/bin/env bash
set -euo pipefail

# === 配置 ===
PROJECT_DIR="/home/ubuntu/Project_longs/me"
DEPLOY_ROOT="/var/www/longsizhuo.com"
RELEASES_DIR="$DEPLOY_ROOT/releases"
CURRENT_LINK="$DEPLOY_ROOT/current"
NGINX_SERVICE="nginx"
BUILD_DIR="$PROJECT_DIR/dist"
TS="$(date +%Y%m%d%H%M%S)"
NEW_RELEASE="$RELEASES_DIR/$TS"
OWNER="www-data:www-data"

echo "📁 切到项目: $PROJECT_DIR"
cd "$PROJECT_DIR"

echo "📥 拉代码..."
git pull --ff-only

echo "📦 安装依赖..."
pnpm install --frozen-lockfile

echo "🏗️ 构建..."
NODE_OPTIONS="--max-old-space-size=2048" pnpm build

echo "📂 准备发布目录: $NEW_RELEASE"
sudo mkdir -p "$NEW_RELEASE" "$RELEASES_DIR"

echo "🚚 同步产物到发布目录（增量+删除多余）"
sudo rsync -aH --delete "$BUILD_DIR"/ "$NEW_RELEASE"/

echo "🔒 设置权限"
sudo chown -R $OWNER "$NEW_RELEASE"

echo "🔗 切换 current -> $TS（原子）"
if [ -L "$CURRENT_LINK" ]; then
  PREV_RELEASE="$(readlink -f "$CURRENT_LINK")"
else
  PREV_RELEASE=""
fi
sudo ln -sfn "$NEW_RELEASE" "$CURRENT_LINK"

echo "🧪 校验 Nginx 配置"
sudo nginx -t

echo "🔁 Reload Nginx"
sudo systemctl reload "$NGINX_SERVICE"

echo "✅ 发布完成 -> $CURRENT_LINK"
echo "↩️  回滚命令（如需）： sudo ln -sfn \"$PREV_RELEASE\" \"$CURRENT_LINK\" && sudo systemctl reload $NGINX_SERVICE"
