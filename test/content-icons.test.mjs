import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const zh = JSON.parse(readFileSync("src/i18n/zh.json", "utf8"));
const en = JSON.parse(readFileSync("src/i18n/en.json", "utf8"));
const SECTIONS = ["experience", "education", "honors"];

test("每个条目都自带 id 和 icon", () => {
  for (const s of SECTIONS) {
    for (const [i, item] of zh[s].items.entries()) {
      assert.ok(item.id, `zh.${s}.items[${i}] 缺 id`);
      assert.ok(item.icon, `zh.${s}.items[${i}] 缺 icon`);
      assert.ok(item.icon.startsWith("https://cdn.longsizhuo.com/"),
        `zh.${s}.items[${i}].icon 不是 CDN URL: ${item.icon}`);
    }
  }
});

test("id 在各段落内唯一——重复 id 会让 React key 撞车", () => {
  for (const s of SECTIONS) {
    const ids = zh[s].items.map((it) => it.id);
    assert.equal(new Set(ids).size, ids.length, `${s} 存在重复 id: ${ids}`);
  }
});

test("中英条目一一对应，且非文本字段完全一致", () => {
  for (const s of SECTIONS) {
    assert.equal(en[s].items.length, zh[s].items.length, `${s} 中英条目数不一致`);
    for (const [i, zhItem] of zh[s].items.entries()) {
      const enItem = en[s].items[i];
      assert.equal(enItem.id, zhItem.id, `${s}[${i}] id 中英不一致`);
      assert.equal(enItem.icon, zhItem.icon, `${s}[${i}] icon 中英不一致`);
      assert.equal(enItem.iconBg, zhItem.iconBg, `${s}[${i}] iconBg 中英不一致`);
    }
  }
});

test("在列表中间插入条目后，其余条目的 icon 不变——这是本次要修的 bug", () => {
  const before = zh.honors.items.map((it) => [it.id, it.icon]);
  const mutated = [...zh.honors.items];
  mutated.splice(1, 0, { id: "inserted", title: "新荣誉", issuer: "x", date: "2026",
                         description: "x", icon: "https://cdn.longsizhuo.com/logos/awards/usyd.png" });
  const after = mutated.filter((it) => it.id !== "inserted").map((it) => [it.id, it.icon]);
  assert.deepEqual(after, before,
    "插入条目后原有条目的 icon 发生了变化——说明 icon 仍与位置绑定");
});
