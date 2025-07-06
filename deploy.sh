#!/bin/bash

set -e  # 遇到错误立即退出

# === 配置路径 ===
PROJECT_DIR="/home/ubuntu/Project_longs/me"
DEPLOY_DIR="/var/www/longsizhuo.com"

echo "📁 切换到项目目录: $PROJECT_DIR"
cd "$PROJECT_DIR"

echo "📥 拉取最新代码..."
git pull

echo "📦 安装依赖..."
pnpm install

echo "🏗️ 构建项目..."
NODE_OPTIONS="--max-old-space-size=2048" pnpm build

echo "🧹 清理旧的部署目录: $DEPLOY_DIR"
sudo rm -rf "$DEPLOY_DIR"
sudo mkdir -p "$DEPLOY_DIR"

echo "🚚 拷贝新构建产物到 $DEPLOY_DIR"
sudo cp -r dist/* "$DEPLOY_DIR"

echo "🔁 重新加载 Nginx"
sudo nginx -t && sudo systemctl reload nginx

echo "✅ longsizhuo.com 部署完成 🎉"
