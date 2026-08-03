// src/pages/admin/tree.ts —— 内容编辑器的树操作。
// 这些函数决定「改一个字段会不会顺手改坏别的」和「上传按钮出现在哪」，
// 出错的表现都是安静的：界面看着正常，存进去的数据已经不对了。
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  blankLike,
  getAt,
  isImageField,
  looksLikeImage,
  moveAt,
  removeAt,
  setAt,
  unionKeys,
  unionLength,
} from "../src/pages/admin/tree.ts";

const sample = () => ({
  hero: { name: "龙思卓", bio: "…" },
  experience: {
    items: [
      { id: "a", title: "甲", icon: "https://cdn.longsizhuo.com/logos/a.png", points: ["p1"] },
      { id: "b", title: "乙", icon: "", points: [] },
    ],
  },
});

test("setAt 不改动原对象（React 靠引用变化判断重渲染）", () => {
  const before = sample();
  const snapshot = JSON.stringify(before);
  const after = setAt(before, ["hero", "name"], "改了");
  assert.equal(JSON.stringify(before), snapshot, "原对象被就地改了");
  assert.equal(getAt(after, ["hero", "name"]), "改了");
  assert.notEqual(after.hero, before.hero, "沿路径的对象应当是新的");
  assert.equal(after.experience, before.experience, "路径之外的分支应当复用");
});

test("setAt 能写进数组下标", () => {
  const after = setAt(sample(), ["experience", "items", 1, "title"], "丙");
  assert.equal(getAt(after, ["experience", "items", 1, "title"]), "丙");
  assert.equal(getAt(after, ["experience", "items", 0, "title"]), "甲");
});

test("removeAt 对数组是 splice、对对象是删键", () => {
  const arr = removeAt(sample(), ["experience", "items", 0]);
  assert.equal(getAt(arr, ["experience", "items"]).length, 1);
  assert.equal(getAt(arr, ["experience", "items", 0, "id"]), "b", "应当是后一项顶上来");

  const obj = removeAt(sample(), ["hero", "bio"]);
  assert.deepEqual(Object.keys(getAt(obj, ["hero"])), ["name"]);
});

test("moveAt 换位，越界时原样返回", () => {
  const moved = moveAt(sample(), ["experience", "items"], 0, 1);
  assert.deepEqual(
    getAt(moved, ["experience", "items"]).map((x) => x.id),
    ["b", "a"],
  );
  const base = sample();
  assert.equal(moveAt(base, ["experience", "items"], 0, 5), base, "越界应当原样返回");
  assert.equal(moveAt(base, ["experience", "items"], 1, -1), base);
});

test("unionKeys 取并集且保持原顺序，不按字母排", () => {
  // 英文有 i18next 的复数键、中文没有；按字母排会打乱 JSON 里的字段顺序。
  const zh = { photoCount: "x", viewAll: "y" };
  const en = { photoCount: "x", viewAll: "y", photoCount_one: "1", photoCount_other: "n" };
  assert.deepEqual(unionKeys(zh, en), ["photoCount", "viewAll", "photoCount_one", "photoCount_other"]);
  assert.deepEqual(unionKeys(en, zh), Object.keys(en));
});

test("unionLength 取较长的一边，好让条目数不一致暴露出来", () => {
  assert.equal(unionLength([1, 2, 3], [1]), 3);
  assert.equal(unionLength(undefined, [1, 2]), 2);
  assert.equal(unionLength("不是数组", null), 0);
});

test("blankLike 照着现有项造空白项，保留字段名", () => {
  const blank = blankLike({ id: "a", title: "甲", n: 3, ok: true, points: ["p"] });
  assert.deepEqual(blank, { id: "", title: "", n: 0, ok: false, points: [] });
});

test("looksLikeImage 只认 http(s) 的图片地址", () => {
  assert.ok(looksLikeImage("https://cdn.longsizhuo.com/logos/a.png"));
  assert.ok(looksLikeImage("http://x.com/a.SVG"));
  assert.ok(looksLikeImage("https://x.com/a.jpg?v=2"));
  assert.ok(!looksLikeImage("/logos/a.png"), "相对路径不算");
  assert.ok(!looksLikeImage("这句话结尾是 a.png"), "普通文案不该被当成链接");
  assert.ok(!looksLikeImage(""));
});

test("isImageField 按字段名判断，空值也要给上传按钮", () => {
  // 新增一条经历时 icon 是空字符串 —— 那正是最需要上传按钮的时刻。
  assert.ok(isImageField(["experience", "items", 1, "icon"], ""));
  assert.ok(isImageField(["projects", "staticItems", 0, "image"], ""));
  assert.ok(!isImageField(["hero", "name"], "龙思卓"));
  // 字段名不在白名单里，但值已经是图片地址，也该给。
  assert.ok(isImageField(["some", "unknownKey"], "https://cdn.longsizhuo.com/x.webp"));
});
