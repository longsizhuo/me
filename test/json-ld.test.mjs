import { test } from "node:test";
import assert from "node:assert/strict";

import { safeJsonLdString } from "../scripts/json-ld.mjs";

test("safeJsonLdString 转义后不含字面量 </script>，且仍是合法 JSON", () => {
  const out = safeJsonLdString({ n: "</script><script>alert(1)</script>" });
  assert.ok(!out.includes("</script>"), "没能防住提前闭合 script 标签");
  const parsed = JSON.parse(out);
  assert.equal(parsed.n, "</script><script>alert(1)</script>");
});

test("转义 U+2028/U+2029：JSON 合法但会断 JS 字符串字面量的字符", () => {
  const out = safeJsonLdString({ n: "a\u2028b\u2029c" });
  assert.ok(!out.includes("\u2028"), "U+2028 没被转义");
  assert.ok(!out.includes("\u2029"), "U+2029 没被转义");
  assert.equal(JSON.parse(out).n, "a\u2028b\u2029c");
});
