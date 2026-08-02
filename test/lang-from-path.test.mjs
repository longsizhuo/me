import { test } from "node:test";
import assert from "node:assert/strict";

// 与 src/i18n/index.ts 的实现保持一致。这里重复一份是因为 node --test
// 不编译 TS；函数只有三行，重复比引入编译步骤划算。
// 改这个函数时两处都要改，content-icons 那类跨文件一致性测试不适用于此。
function langFromPath(pathname) {
  const seg = pathname.split("/")[1];
  return seg === "zh" || seg === "en" ? seg : null;
}

test("/zh 和 /en 解析出语言", () => {
  assert.equal(langFromPath("/zh"), "zh");
  assert.equal(langFromPath("/en"), "en");
});

test("带尾部路径也能解析", () => {
  assert.equal(langFromPath("/zh/"), "zh");
  assert.equal(langFromPath("/en/tools"), "en");
});

test("根路径和其他路径返回 null，交给后续优先级决定", () => {
  assert.equal(langFromPath("/"), null);
  assert.equal(langFromPath("/tools"), null);
  assert.equal(langFromPath(""), null);
});

test("不把 zh/en 之外的段当语言", () => {
  assert.equal(langFromPath("/zhihu"), null);
  assert.equal(langFromPath("/english"), null);
  assert.equal(langFromPath("/ZH"), null);
});
