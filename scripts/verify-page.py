#!/usr/bin/env python3
"""载入一个页面，报告控制台错误、失败请求和资源来源，并截图。

用法:
    python3 scripts/verify-page.py <url> [截图路径] [等待毫秒]

退出码 0 = 无控制台错误且无失败请求；1 = 有问题。
配合 `pnpm preview` 或 `pnpm dev` 使用，服务由调用方自己起。
"""
import sys
from collections import Counter
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright

url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:4173/"
shot = sys.argv[2] if len(sys.argv) > 2 else "/tmp/page.png"
settle_ms = int(sys.argv[3]) if len(sys.argv) > 3 else 6000

console_errors, page_errors, failed = [], [], []
hosts = Counter()

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1440, "height": 1000})

    page.on("console", lambda m: console_errors.append(m.text) if m.type == "error" else None)
    page.on("pageerror", lambda e: page_errors.append(str(e)))
    page.on("requestfailed",
            lambda r: failed.append(f"{r.failure} {r.url[:120]}"))
    page.on("response",
            lambda r: (hosts.update([urlparse(r.url).netloc or "inline"]),
                       failed.append(f"HTTP {r.status} {r.url[:120]}") if r.status >= 400 else None))

    page.goto(url, wait_until="load", timeout=60000)
    # 滚到底再滚回顶，触发所有 IntersectionObserver 懒加载
    page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    page.wait_for_timeout(settle_ms // 2)
    page.evaluate("window.scrollTo(0, 0)")
    page.wait_for_timeout(settle_ms // 2)
    page.screenshot(path=shot, full_page=True)
    title = page.title()
    html_lang = page.get_attribute("html", "lang")
    browser.close()

print(f"URL        : {url}")
print(f"<title>    : {title}")
print(f"<html lang>: {html_lang}")
print(f"截图        : {shot}")
print("\n资源来源统计:")
for host, n in hosts.most_common():
    print(f"  {n:4}  {host}")

for label, items in (("控制台错误", console_errors),
                     ("未捕获异常", page_errors),
                     ("失败请求", failed)):
    print(f"\n{label} ({len(items)}):")
    for x in items[:25]:
        print(f"  - {x}")
    if len(items) > 25:
        print(f"  ... 另有 {len(items) - 25} 条")

bad = len(console_errors) + len(page_errors) + len(failed)
print(f"\n{'通过 ✓' if bad == 0 else f'发现 {bad} 个问题 ✗'}")
sys.exit(0 if bad == 0 else 1)
