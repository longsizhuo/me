#!/usr/bin/env bash
# 部署后通知 Bing / Yandex 重新抓取。Google 既不支持 IndexNow，
# 也早已放弃处理 sitemap ping —— 这个脚本只覆盖 Bing 和 Yandex，别的引擎不受影响。
#
# 上线前不要跑：key 文件要先能通过 https://longsizhuo.com/<key>.txt 访问到，
# 否则 IndexNow 会直接拒绝这次提交。
set -euo pipefail

command -v jq >/dev/null 2>&1 || { echo "需要 jq（构建 JSON body），未找到" >&2; exit 1; }

KEY="b142bdf8249264938e19661fd28a80be"
HOST="longsizhuo.com"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SITEMAP="$SCRIPT_DIR/../public/sitemap.xml"

# URL 列表从 sitemap.xml 读取而不是写死：sitemap 现在 8 条会继续涨,
# 写死的列表迟早会和它对不上。
mapfile -t urls < <(grep -oP '(?<=<loc>)[^<]+' "$SITEMAP")
[ "${#urls[@]}" -gt 0 ] || { echo "sitemap.xml 里没解析到任何 <loc>" >&2; exit 1; }

body=$(jq -n --arg host "$HOST" --arg key "$KEY" --arg keyLocation "https://$HOST/$KEY.txt" \
  --args '{host: $host, key: $key, keyLocation: $keyLocation, urlList: $ARGS.positional}' \
  "${urls[@]}")

curl -sS -X POST https://api.indexnow.org/indexnow \
  -H "Content-Type: application/json" \
  -d "$body" \
  -w "\nHTTP %{http_code}\n"
