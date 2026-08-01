#!/usr/bin/env bash
# 端到端跑 icon-binding 回归测试：build -> 起 preview -> 跑 python 测试 -> 收尾杀掉 preview。
#
# 为什么这段收尾逻辑单独放成一个文件，而不是直接写成 package.json 里的一行
# script：pkill 的 pattern 如果和调用它的这个 shell 自己的完整命令行写在
# 同一行文本里，pkill -f 会连这行自己的 cmdline 也匹配上，把整个编排进程
# 提前杀掉（实测过：exit 143 "Terminated"，测试真实结果被吞掉）。单独写成
# 脚本文件后，编排进程的 cmdline 只是 `bash test/run-icon-check.sh`，不含
# "vite"/"preview" 字样，pkill 就只会命中真正的 vite preview 进程。
set -uo pipefail
cd "$(dirname "$0")/.."

pnpm build || exit 1
pnpm preview --port 4173 &
sleep 4
python3 test/icon-binding.spec.py "http://localhost:4173/"
code=$?
pkill -f "vite.*preview" 2>/dev/null
exit "$code"
