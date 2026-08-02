#!/usr/bin/env python3
"""回归测试：一个 canvas 的 GLTF 加载失败时，ErrorBoundary 必须兜住它，
不能让整个 React root 被卸载。

背景：Task 7 期间 R2 缺 CORS 策略，EarthCanvas 的 useGLTF 抛出未捕获的
rejection，页面因此全黑（导航、Hero、所有区块全部消失）——因为当时全仓库
没有一个 ErrorBoundary。Suspense 只处理 pending，不处理 rejected，这是
两套不同的机制，光有 Suspense 挡不住这个。

本测试把 Earth.tsx 里 useGLTF 的 URL 临时指向一个真实不存在的对象
（cdn.longsizhuo.com/models/DOES-NOT-EXIST.gltf，真实 404，不是 mock），
构建、起 preview、加载页面，断言：
  1. 页面其余部分仍然渲染 —— 导航栏品牌名 "Sizhuo Long" 和 Hero 姓名
     "Siz Long" 都还在（页面没塌）
  2. 控制台里出现 "[ErrorBoundary:" 前缀的日志，证明这次失败是被
     boundary 接住的，不是网络请求碰巧成功

用法（调用方需先起好 preview 服务，且 dist/ 要是本次改动后重新 build 的）：
    python3 test/error-boundary.spec.py http://localhost:4173/

这个测试本身要 build 两次（注入故障 + 复原），所以调用方只需要负责起
preview（build 完 dist 在磁盘上，vite preview 直接从磁盘读，不需要重启）。
"""
import pathlib
import shutil
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
EARTH = ROOT / "src/components/canvas/Earth.tsx"
URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:4173/"

ORIGINAL_KEY = 'cdnUrl("models/planet/scene.gltf")'
BROKEN_KEY = 'cdnUrl("models/DOES-NOT-EXIST.gltf")'


def build():
    subprocess.run(["pnpm", "build"], cwd=ROOT, check=True,
                    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def load_and_check(url):
    from playwright.sync_api import sync_playwright
    console_errors = []
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={"width": 1440, "height": 1000})
        pg.on("console", lambda m: console_errors.append(m.text) if m.type == "error" else None)
        pg.goto(url, wait_until="load", timeout=60000)
        pg.wait_for_timeout(6000)
        body_text = pg.inner_text("body")
        b.close()
    return body_text, console_errors


# 前置检查：Earth.tsx 必须是干净的。理由同 icon-binding.spec.py —— finally
# 挡得住异常/断言失败/Ctrl-C，挡不住 SIGKILL，用 git status 兜底顺便测出
# 「上次是不是被强杀过」。
dirty = subprocess.run(
    ["git", "status", "--porcelain", str(EARTH)],
    cwd=ROOT, check=True, capture_output=True, text=True,
).stdout.strip()
if dirty:
    sys.exit(
        f"{EARTH} 不干净，拒绝启动（怕是上一次运行被强杀，留下了改动）。\n"
        f"  git status 输出: {dirty}\n"
        f"  确认无残留改动后用 `git checkout -- {EARTH}` 恢复再重跑。"
    )

backup = EARTH.with_suffix(".tsx.bak")
shutil.copy(EARTH, backup)
try:
    original = EARTH.read_text(encoding="utf-8")
    assert ORIGINAL_KEY in original, (
        "Earth.tsx 里没找到预期的 useGLTF 调用写法，测试需要跟着改一下匹配串"
    )
    EARTH.write_text(original.replace(ORIGINAL_KEY, BROKEN_KEY), encoding="utf-8")

    build()
    body_text, console_errors = load_and_check(URL)
finally:
    # 先恢复源文件，再重新 build —— 这样即使 build 失败，工作区也不会
    # 停留在「注入了故障」的状态。
    shutil.move(str(backup), str(EARTH))
    build()

boundary_logs = [m for m in console_errors if "[ErrorBoundary:" in m]
nav_present = "Sizhuo Long" in body_text
hero_present = "Siz Long" in body_text

print(f"控制台错误总数: {len(console_errors)}")
print(f"含 [ErrorBoundary: 的行: {boundary_logs}")
print(f"导航品牌名 'Sizhuo Long' 存在: {nav_present}")
print(f"Hero 姓名 'Siz Long' 存在: {hero_present}")

assert nav_present, "导航栏品牌名没找到 —— 页面塌了，React root 被卸载"
assert hero_present, "Hero 姓名没找到 —— 页面塌了，React root 被卸载"
assert boundary_logs, "控制台没有 [ErrorBoundary: 日志 —— 这次失败不是被 boundary 接住的"
print("通过 ✓ 页面其余部分仍渲染，且 ErrorBoundary 记录了这次失败")
