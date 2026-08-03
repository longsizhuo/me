#!/usr/bin/env python3
"""回归测试：懒加载分片取不到时，页面必须自动刷新一次恢复；一直取不到时，
必须停在一句错误提示上，绝不能反复刷新。

背景：每次部署都会换掉所有分片的哈希文件名，旧的当场消失。一个开着页面的
访客点进还没加载过的路由时，浏览器去取的就是一个已经不存在的 chunk。而且
它拿不到 404 —— Caddy 的 SPA 回退连 /assets/*.js 也接，缺失分片返回的是
200 + index.html，浏览器把 HTML 当 ES 模块解析、报语法错误、import() 被
reject，访客只看到一句「加载出错」。src/lazyWithReload.ts 就是为这个而写的。

为什么这个测试非有不可：lazyWithReload 的第一版用了一个全局共享的
sessionStorage 标记，结果刷新之后别的懒加载组件先加载成功、把标记清掉，
坏掉的那个再失败时又看到「没刷过」，于是再刷 —— 无限循环。实测 85 次导航
还在涨。改成按组件分开记之后才停下。这种 bug 在人工点几下时看不出来
（页面只是「闪」），只有数导航次数才抓得到。

做法：起一个和 Caddy 一样会 SPA 回退的静态服务器，用 Playwright 拦截
AlbumAdmin 分片的请求、按场景返回 index.html 的 HTML 内容（真实复现那个
200+HTML，不是伪造一个网络错误），然后数主框架导航次数。

用法（调用方需先 build，dist/ 要是本次改动后的产物）：
    python3 test/chunk-reload.spec.py
退出码 0 表示通过。
"""
import asyncio
import functools
import http.server
import os
import sys
import threading
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
DIST = REPO / "dist"
PORT = 8796


class SpaHandler(http.server.SimpleHTTPRequestHandler):
    """缺什么都回 index.html —— 复现 Caddy 的行为，包括对 /assets/*.js。"""

    def send_head(self):
        path = self.translate_path(self.path)
        if not os.path.exists(path) or os.path.isdir(path):
            self.path = "/index.html"
        return super().send_head()

    def log_message(self, *args):
        pass


def serve():
    os.chdir(DIST)
    httpd = http.server.HTTPServer(("127.0.0.1", PORT), functools.partial(SpaHandler))
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd


async def run_case(pw, *, always_fail):
    """返回 (分片请求次数, 导航是否已停止, 页面文字)。"""
    html = (DIST / "index.html").read_text()
    browser = await pw.chromium.launch()
    page = await browser.new_page(viewport={"width": 1280, "height": 900})
    state = {"blocked": 0, "navs": 0}

    def on_nav(frame):
        if frame == page.main_frame:
            state["navs"] += 1

    page.on("framenavigated", on_nav)

    async def handle(route):
        # 只在该失败的时候返回 HTML；否则放行，让真实分片加载成功。
        if always_fail or state["blocked"] == 0:
            state["blocked"] += 1
            await route.fulfill(status=200, content_type="text/html; charset=utf-8", body=html)
        else:
            await route.continue_()

    await page.route("**/assets/AlbumAdmin-*.js", handle)
    try:
        # commit 而不是 networkidle：自动刷新会打断导航，networkidle 永远等不到。
        await page.goto(f"http://127.0.0.1:{PORT}/admin?tab=album", wait_until="commit", timeout=15000)
    except Exception:
        pass  # 被刷新打断是预期内的

    await page.wait_for_timeout(8000)
    navs_before = state["navs"]
    await page.wait_for_timeout(5000)
    settled = state["navs"] == navs_before
    body = await page.inner_text("body")
    await browser.close()
    return state["blocked"], settled, body


async def main():
    from playwright.async_api import async_playwright

    failures = []
    serve()
    async with async_playwright() as pw:
        # 场景一：只失败一次 —— 真实的部署错位。刷新后新分片就在了。
        blocked, settled, body = await run_case(pw, always_fail=False)
        if not settled:
            failures.append("部署错位场景：导航次数仍在增长，说明陷入了刷新循环")
        if "这个面板加载出错" in body:
            failures.append("部署错位场景：自动刷新后仍显示错误提示，没有恢复")
        if "New album" not in body:
            failures.append("部署错位场景：刷新后没有回到相册面板")

        # 场景二：一直失败 —— 分片是真的坏了，不是版本错位。
        blocked, settled, body = await run_case(pw, always_fail=True)
        if not settled:
            failures.append("持续失败场景：无限刷新（这正是第一版的 bug）")
        if blocked > 2:
            failures.append(f"持续失败场景：分片被请求 {blocked} 次，应当最多 2 次（首次 + 一次刷新）")
        if "这个面板加载出错" not in body:
            failures.append("持续失败场景：应当降级为一句错误提示，而不是空白或持续刷新")

    if failures:
        for f in failures:
            print(f"FAIL: {f}")
        return 1
    print("PASS: 分片加载失败时自动恢复一次，持续失败时停下报错，均无刷新循环")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
