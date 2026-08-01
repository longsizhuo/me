#!/usr/bin/env python3
"""回归测试：每张卡片显示的是它自己的 logo，而不是按位置取的第 N 个。

改造前 Honors.tsx 用 honorIcons[index]、Education.tsx 用 universityIcons[index]、
Experience.tsx 用 experiences[index]?.icon，在列表开头插一条会让后面所有 logo 顶错
一格。本测试通过临时在三个列表里各插入一条数据并断言其余卡片 logo 不变来守住
这个性质。

三个区块都要插、不能只插 honors 一个：Honors.tsx 改造前的写法是
`<HonorCard icon={honorIcons[index]} {...honor} />`——`{...honor}` 排在
`icon` 后面，而 Task 4 已经给每条 honor 数据本身也加上了 `icon` 字段，于是
`honor.icon` 会覆盖掉 `honorIcons[index]`，改造前的 bug 在 Honors 这一处已经
被数据迁移「意外治好」了，插 honors 探针测不出任何东西（已用 playwright 实测
确认：改造前的 Honors.tsx 配上改造后的 en.json，四张卡片渲染出来的仍是各自
正确的 CDN URL）。Education/Experience 没有这层 spread，图标严格来自本地下标
数组，插探针能真实复现错位。为了同时守住三个组件、且不因为上面这个巧合而
让测试失去意义，探针在三个列表里都插一条。

用法（调用方需先起好 preview 服务）：
    python3 test/icon-binding.spec.py http://localhost:4173/
"""
import json
import pathlib
import shutil
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
# 改 en.json，不是 zh.json：src/i18n/index.ts 里 `lng: savedLang || "en"`，
# 全新的 Playwright 会话没有 localStorage["lang"]，页面永远先渲染英文。
# 改 zh.json 对一个从没读过它的页面毫无意义 —— 实测过，改 zh 时前后 10 张卡片
# 的 src 全部原样不动，不是因为 bug 修好了，是因为页面根本没读那份文件。
EN = ROOT / "src/i18n/en.json"
URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:4173/"


SECTION_IDS = ["work", "education", "honors"]  # Experience/Education/Honors 各自的 hash-span id

def card_icons(url):
    """返回 {"区块id::卡片标题": 图标 URL}，只看工作经验/教育/荣誉三个区块。

    页面上还有一个 GitHub 项目区块（id="projects"），它的卡片图片是 @octokit
    调用 GitHub API 实时拿到的签名 URL，每次构建都会变（时间戳/签名不同）——
    如果不把扫描范围限制在这三个区块，projects 卡片会被误判成"漂移"，
    跟本测试要守的 icon-与位置绑定 完全无关。

    key 带区块前缀（而不是裸标题）：一是不同区块的标题理论上可能撞车
    （比如某条 education.degree 恰好等于某条 experience.title），裸标题会
    在字典里互相覆盖，悄悄漏测；二是让下面的覆盖率检查能按区块断言，而不是
    只看一个总数。
    """
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={"width": 1440, "height": 1200})
        pg.goto(url, wait_until="load", timeout=60000)
        pg.wait_for_timeout(4000)
        out = pg.evaluate(
            """(sectionIds) => {
                const out = {};
                for (const id of sectionIds) {
                    const span = document.getElementById(id);
                    const section = span && span.parentElement;
                    if (!section) continue;
                    for (const h3 of section.querySelectorAll('h3')) {
                        const title = (h3.textContent || '').trim();
                        if (!title) continue;
                        let node = h3, img = null;
                        for (let i = 0; i < 6 && node; i++) {
                            img = node.querySelector && node.querySelector('img');
                            if (img) break;
                            node = node.parentElement;
                        }
                        if (img) out[id + '::' + title] = img.getAttribute('src');
                    }
                }
                return out;
            }""",
            SECTION_IDS,
        )
        b.close()
    return out


def build_and_serve():
    subprocess.run(["pnpm", "build"], cwd=ROOT, check=True,
                    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


backup = EN.with_suffix(".json.bak")

# 前置检查：en.json 必须是干净的。这个脚本会临时改写它、只在 try/finally 里
# 恢复——finally 挡得住异常/断言失败/Ctrl-C，挡不住 SIGKILL。en.json 是被
# git 跟踪的文件，没有 .bak 的 gitignore 规则，一次被强杀的运行会把三条
# TMP PROBE 数据和一个 en.json.bak 留在工作区，后面一次 `git commit -am`
# 就会把探针数据带上线。用 git status 兜底，同时这也正好能测出「上次是不是
# 被强杀过」。
dirty = subprocess.run(
    ["git", "status", "--porcelain", "src/i18n/en.json"],
    cwd=ROOT, check=True, capture_output=True, text=True,
).stdout.strip()
if dirty:
    sys.exit(
        "src/i18n/en.json 不干净，拒绝启动（怕是上一次运行被强杀，留下了探针数据）。\n"
        f"  git status 输出: {dirty}\n"
        f"  若存在 {backup} ，用它恢复：mv {backup} {EN} && git diff src/i18n/en.json 确认无探针残留后再重跑。\n"
        "  若 .bak 不存在，直接 git checkout -- src/i18n/en.json。"
    )

shutil.copy(EN, backup)
try:
    build_and_serve()
    before = card_icons(URL)
    assert before, "没抓到任何卡片，测试本身失效了"

    PROBE_ICON = "https://cdn.longsizhuo.com/logos/awards/copyright.png"
    PROBE_TITLES = {"honors::TMP PROBE H", "education::TMP PROBE E", "work::TMP PROBE X"}
    data = json.loads(EN.read_text(encoding="utf-8"))
    data["honors"]["items"].insert(0, {
        "id": "tmp-probe-honor", "title": "TMP PROBE H", "issuer": "x",
        "date": "2026", "description": "x", "icon": PROBE_ICON,
    })
    data["education"]["items"].insert(0, {
        "id": "tmp-probe-edu", "degree": "TMP PROBE E", "university": "x",
        "duration": "2026", "coursework": "x", "icon": PROBE_ICON, "iconBg": "#FFF",
    })
    data["experience"]["items"].insert(0, {
        "id": "tmp-probe-exp", "title": "TMP PROBE X", "company": "x",
        "date": "2026", "points": ["x"], "icon": PROBE_ICON, "iconBg": "#FFF",
    })
    EN.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    build_and_serve()
    after = card_icons(URL)
finally:
    shutil.move(backup, EN)
    build_and_serve()

shared = set(before) & set(after) - PROBE_TITLES
covered = {k.split("::", 1)[0] for k in shared}
missing = set(SECTION_IDS) - covered
assert not missing, (
    f"缺区块: {missing} —— 该区块的卡片一张都没被扫到，"
    "测试对它已经形同虚设（不是覆盖率不够，是覆盖率归零）"
)
assert len(shared) >= 6, f"共同卡片太少（{len(shared)}），测试覆盖不足"
drift = {k: (before[k], after[k]) for k in shared if before[k] != after[k]}
if drift:
    for k, (b, a) in drift.items():
        print(f"  错位: {k}\n    改前 {b}\n    改后 {a}")
    sys.exit(f"{len(drift)} 张卡片在插入条目后 logo 发生变化 —— icon 仍与位置绑定")
print(f"通过 ✓ 插入条目后 {len(shared)} 张卡片的 logo 全部不变")
