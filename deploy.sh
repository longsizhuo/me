#!/bin/bash

set -e

PROJECT_DIR="/home/ubuntu/Project_longs/me"
DEPLOY_DIR="/var/www/longsizhuo.com"

echo "📁 切换到项目目录: $PROJECT_DIR"
cd "$PROJECT_DIR"

echo "📥 强制拉取远程最新代码..."
git fetch origin
git reset --hard origin/$(git rev-parse --abbrev-ref HEAD)
git clean -fd

echo "📦 安装依赖..."
pnpm install

echo "🏗️ 构建项目（提升内存限制）..."
NODE_OPTIONS="--max-old-space-size=1024" pnpm build

echo "🧹 清理旧部署目录: $DEPLOY_DIR"
sudo rm -rf "$DEPLOY_DIR"
sudo mkdir -p "$DEPLOY_DIR"

echo "🚚 拷贝构建产物到 $DEPLOY_DIR"
sudo cp -r dist/* "$DEPLOY_DIR"

echo "🔁 重载 Nginx"
sudo nginx -t && sudo systemctl reload nginx

echo "✅ 部署完成！🎉 longsizhuo.com 已更新"
