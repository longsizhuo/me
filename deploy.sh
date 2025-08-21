#!/usr/bin/env bash
set -euo pipefail

# ========= 配置 =========
PROJECT_DIR="/home/ubuntu/Project_longs/me"      # 前端项目根目录
ASSET_ROOT_REL="src/assets/album"                # 递归扫描 HEIC 的资源目录（相对 PROJECT_DIR）
BUILD_CMD="pnpm build"                            # 构建命令
INSTALL_CMD="pnpm install --frozen-lockfile"      # 安装依赖命令
NODE_OPTIONS_MAX_OLD_SPACE="2048"                 # 构建内存上限（MB）
NGINX_SITE_ROOT="/var/www/longsizhuo.com"         # ★ Nginx root 不变
OWNER="www-data:www-data"                         # 目标目录属主
NGINX_SERVICE="nginx"                             # Nginx 服务名

# ========= 日志工具 =========
log() { printf "\033[1;36m%s\033[0m %s\n" "==>" "$*"; }
warn() { printf "\033[1;33m%s\033[0m %s\n" "WARN:" "$*"; }
die() { printf "\033[1;31m%s\033[0m %s\n" "ERROR:" "$*" >&2; exit 1; }

need() { command -v "$1" >/dev/null 2>&1; }

# ========= 预检查 =========
need pnpm || die "未找到 pnpm，请先安装（curl -fsSL https://get.pnpm.io/install.sh | sh -）"
need rsync || die "未找到 rsync，请先安装（sudo apt-get install -y rsync）"
[ -d "$PROJECT_DIR" ] || die "PROJECT_DIR 不存在：$PROJECT_DIR"
[ -d "$NGINX_SITE_ROOT" ] || sudo mkdir -p "$NGINX_SITE_ROOT"

ASSET_ROOT="$PROJECT_DIR/$ASSET_ROOT_REL"
[ -d "$ASSET_ROOT" ] || warn "资源目录不存在：$ASSET_ROOT（将跳过 HEIC 转换）"

# ========= 功能函数：检测 ffmpeg 是否可处理 HEIC =========
ffmpeg_supports_heic() {
  # ffmpeg 支持 heic 通常由 libheif 提供，这里做一次静默探测
  # 方式1：查解复用器/解码器名字（有的构建没列出 heic demuxer，但能用 heif）
  if ffmpeg -v quiet -demuxers | grep -qiE '\bheic\b|\bheif\b'; then
    return 0
  fi
  # 方式2：尝试转换一个虚拟文件名（一定失败，但能看到是否识别 heic 格式）
  # 仅作为次优探测，不产生输出。
  return 1
}

# ========= HEIC → PNG 转换器 =========
convert_heic_to_png() {
  [ -d "$ASSET_ROOT" ] || { log "跳过 HEIC 转换：$ASSET_ROOT 不存在"; return 0; }

  mapfile -t heic_files < <(find "$ASSET_ROOT" -type f \( -iname '*.heic' -o -iname '*.HEIC' \) | sort)
  if [ ${#heic_files[@]} -eq 0 ]; then
    log "未发现 HEIC 文件，跳过转换"
    return 0
  fi

  log "发现 ${#heic_files[@]} 个 HEIC 文件，开始转换为 PNG（就地同名生成）..."

  # 选择工具：按“实际试跑”探测可用性
  choose_tool() {
    local test_file="$1"
    # 优先 ffmpeg
    if command -v ffmpeg >/dev/null 2>&1; then
      local out="${test_file%.*}.png"
      if ffmpeg -y -hide_banner -loglevel error -i "$test_file" -frames:v 1 -map_metadata 0 -an -pix_fmt rgb24 "$out" 2>/dev/null; then
        rm -f "$out"
        echo "ffmpeg"; return 0
      fi
    fi
    # 其次 ImageMagick
    if command -v magick >/dev/null 2>&1; then
      local out="${test_file%.*}.png"
      if magick "$test_file" "$out" 2>/dev/null; then
        rm -f "$out"
        echo "magick"; return 0
      fi
    fi
    # 再次 heif-convert（libheif-examples 提供）
    if command -v heif-convert >/dev/null 2>&1; then
      local out="${test_file%.*}.png"
      if heif-convert "$test_file" "$out" >/dev/null 2>&1; then
        rm -f "$out"
        echo "heif-convert"; return 0
      fi
    fi
    return 1
  }

  tool=""
  if tool=$(choose_tool "${heic_files[0]}"); then
    log "使用转换工具：$tool"
  else
    die "未找到可用的转换工具（请安装：ImageMagick 或 libheif-examples，或带 libheif 的 ffmpeg）"
  fi

  local converted=0 skipped=0 failed=0
  for f in "${heic_files[@]}"; do
    out="${f%.*}.png"
    if [ -f "$out" ] && [ "$out" -nt "$f" ]; then
      ((skipped++)) || true
      continue
    fi

    case "$tool" in
      ffmpeg)
        if ffmpeg -y -hide_banner -loglevel error \
          -i "$f" -frames:v 1 -map_metadata 0 -an -pix_fmt rgb24 "$out"; then
          ((converted++)) || true
        else
          ((failed++)) || true
          warn "ffmpeg 转换失败：$f"
        fi
        ;;
      magick)
        if magick "$f" "$out"; then
          ((converted++)) || true
        else
          ((failed++)) || true
          warn "magick 转换失败：$f"
        fi
        ;;
      heif-convert)
        if heif-convert "$f" "$out" >/dev/null; then
          ((converted++)) || true
        else
          ((failed++)) || true
          warn "heif-convert 转换失败：$f"
        fi
        ;;
    esac
  done

  log "HEIC 转换完成：成功 $converted，跳过 $skipped，失败 $failed"
  [ "$failed" -eq 0 ] || warn "部分文件转换失败：请确认依赖或源文件是否损坏"
}


# ========= 开始 =========
log "切换到项目目录: $PROJECT_DIR"
cd "$PROJECT_DIR"

log "拉取代码..."
git pull --ff-only

log "执行 HEIC → PNG 转换（构建前）..."
convert_heic_to_png

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
