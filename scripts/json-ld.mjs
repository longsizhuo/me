/**
 * 把对象序列化成可以安全放进 <script type="application/ld+json"> 的字符串。
 *
 * 转义 < > & 是防止值里出现 </script> 提前闭合标签（进而拼出新的
 * <script> 执行任意代码）；转义 U+2028/U+2029 是因为它们在 JSON 里
 * 合法，但被某些环境当成行终止符解析时会打断 JS 字符串字面量。
 *
 * 现在 index.html 的 JSON-LD 是构建期从 i18n 生成的静态内容，事实上
 * 没有注入面。这个函数提前铺路：第二期内容如果改从别处（比如 KV）
 * 动态来，序列化点必须走这里而不是裸 JSON.stringify。
 */
export function safeJsonLdString(data) {
  return JSON.stringify(data, null, 2)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
