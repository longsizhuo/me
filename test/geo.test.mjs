import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { esc, geo, loadLocales, renderJsonLd, renderLlmsTxt, renderShell } from "../scripts/geo.mjs";

const locales = loadLocales();
const { zh } = locales;
const indexHtml = readFileSync("index.html", "utf8");
const transform = (html) => geo().transformIndexHtml.handler(html);

// 这条是整组测试的重点：占位符没了就静默退回「AI 只读得到 <title>」的状态，
// 页面看起来还完全正常，只有爬虫吃亏 —— 只能靠测试拦。
test("index.html 保留两个注入占位符", () => {
  assert.ok(indexHtml.includes("<!--geo-->"), "#root 的 <!--geo--> 占位符被删了");
  assert.ok(indexHtml.includes("<!--geo-jsonld-->"), "JSON-LD 的 <!--geo-jsonld--> 占位符被删了");
});

test("注入后占位符被替换干净，事实进了正文 DOM 而不是 noscript", () => {
  const out = transform(indexHtml);
  assert.ok(!out.includes("<!--geo-->"), "占位符没被替换");
  assert.ok(!out.includes("<!--geo-jsonld-->"), "JSON-LD 占位符没被替换");
  assert.ok(!/<noscript[\s>]/.test(out), "内容不能回到 noscript：提取器会整段丢掉");
  assert.match(out, /<div id="root"><style>[\s\S]*<div class="geo-shell">/);
});

// i18n 里加一个奖/一段经历，就该自动出现在爬虫读得到的地方。
// 断言逐条比对，而不是抽查几个关键词。
test("zh.json 里每条经历、学历、荣誉、项目都出现在正文里", () => {
  const shell = renderShell(locales);
  // 比对前先过一遍 esc：i18n 文案里有单引号（"获得 'A' 绩效评级"），
  // 拼进 HTML 时会变成 &#39;，拿原文直接 includes 会假阴性。
  const has = (s, msg) => assert.ok(shell.includes(esc(s)), msg);
  for (const e of zh.experience.items) {
    has(e.company, `经历缺失：${e.company}`);
    for (const p of e.points) {
      has(p, `经历条目缺失：${p.slice(0, 20)}…`);
    }
  }
  for (const e of zh.education.items) {
    has(e.degree, `学历缺失：${e.degree}`);
  }
  for (const h of zh.honors.items) {
    has(h.title, `荣誉缺失：${h.title}`);
    has(h.issuer, `颁发方缺失：${h.issuer}`);
  }
  for (const p of zh.projects.staticItems) {
    has(p.source_code_link, `项目链接缺失：${p.name}`);
  }
});

test("正文做了 HTML 转义，i18n 里的尖括号引号不会破坏结构", () => {
  const shell = renderShell({
    zh: structuredClone(zh),
    en: structuredClone(locales.en),
  });
  assert.ok(!/<script/i.test(shell), "正文不该出现 script");

  const injected = renderShell({
    ...locales,
    zh: { ...zh, hero: { ...zh.hero, name: '<img src=x onerror="alert(1)">' } },
  });
  assert.ok(!injected.includes("<img"), "i18n 内容必须转义后再拼进 HTML");
  assert.ok(injected.includes("&lt;img"), "转义结果不对");
});

test("JSON-LD 转义后仍是合法 JSON，且带上了奖项和学历", () => {
  const out = transform(indexHtml);
  const raw = out.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1];
  // 注入时把 < 转成了 < 防止 </script> 提前闭合，JSON.parse 认这个转义。
  const ld = JSON.parse(raw);
  assert.equal(ld["@type"], "Person");
  assert.equal(ld.award.length, zh.honors.items.length);
  assert.ok(ld.award.some((a) => a.includes("蓝桥杯")));
  assert.equal(ld.hasCredential.length, zh.education.items.length);
  assert.ok(ld.email.startsWith("mailto:"));
});

test("llms.txt 有 H1、速览和全部荣誉", () => {
  const txt = renderLlmsTxt(locales);
  assert.match(txt, /^# 龙思卓 \(Sizhuo Long\)/);
  assert.ok(txt.includes("Email：longsizhuo@gmail.com"));
  for (const h of zh.honors.items) {
    assert.ok(txt.includes(h.title), `llms.txt 缺荣誉：${h.title}`);
  }
});

test("构建时把 llms.txt 作为产物 emit 出去", () => {
  const emitted = [];
  geo().generateBundle.call({ emitFile: (f) => emitted.push(f) });
  assert.equal(emitted.length, 1);
  assert.equal(emitted[0].fileName, "llms.txt");
  assert.ok(emitted[0].source.includes("快手"));
});

test("renderJsonLd 不把中文键名写死成英文岗位", () => {
  const ld = renderJsonLd(locales);
  assert.equal(ld.jobTitle, locales.en.experience.items[0].title);
  assert.equal(ld.description, locales.en.hero.bio);
});

// Emptying an array (deliberately, or because someone deleted the last
// entry) used to crash indexing items[0] or throw nothing at all from
// .map() — but that first case brought down the entire build. It must
// degrade to "skip that section", not take pnpm build down with it.
test("数组被清空时跳过对应内容，而不是抛异常拖垮整个构建", () => {
  const empty = {
    zh: {
      ...zh,
      experience: { ...zh.experience, items: [] },
      education: { ...zh.education, items: [] },
      honors: { ...zh.honors, items: [] },
      projects: { ...zh.projects, staticItems: [] },
    },
    en: {
      ...locales.en,
      experience: { ...locales.en.experience, items: [] },
      education: { ...locales.en.education, items: [] },
      honors: { ...locales.en.honors, items: [] },
    },
  };

  assert.doesNotThrow(() => renderShell(empty), "renderShell 不该在空数组上抛异常");
  assert.doesNotThrow(() => renderJsonLd(empty), "renderJsonLd 不该在空数组上抛异常");
  assert.doesNotThrow(() => renderLlmsTxt(empty), "renderLlmsTxt 不该在空数组上抛异常");

  const shell = renderShell(empty);
  assert.ok(!shell.includes('class="geo-role"'), "experience 为空时不该渲染当前职位那一行");
  assert.ok(!shell.includes(esc(zh.honors.title)), "honors 为空数组时标题不该出现在正文里");
  assert.ok(!shell.includes(esc(zh.education.title)), "education 为空数组时标题不该出现在正文里");

  const ld = renderJsonLd(empty);
  assert.equal(ld.jobTitle, undefined, "experience 为空时 jobTitle 应省略而不是抛异常");
  assert.deepEqual(ld.award, [], "honors 为空数组时 award 应是空数组，不是抛异常");
  assert.deepEqual(ld.alumniOf, [], "education 为空数组时 alumniOf 应是空数组");

  const txt = renderLlmsTxt(empty);
  assert.ok(!txt.includes("现职"), "experience 为空时不该出现现职行");
  assert.ok(!txt.includes(`## ${zh.honors.title}`), "honors 为空数组时不该出现该 section 标题");
});

// 数组字段整体缺失（不是空，是这个 key 根本不存在）是另一类失败：那是
// i18n 文件本身坏了（比如自动翻译 CI 漏生成了某个键），必须报错，且报错
// 要点名是哪个字段、哪个文件 —— 不能是三层调用之后一句无关的
// "Cannot read properties of undefined"。
test("数组字段整体缺失（而非空）时报错，且点名字段和文件", () => {
  const broken = {
    zh: { ...zh, honors: { ...zh.honors, items: undefined } },
    en: locales.en,
  };
  assert.throws(() => renderJsonLd(broken), /honors\.items/, "报错要点名缺失的字段");
  assert.throws(() => renderJsonLd(broken), /zh\.json/, "报错要点名是哪个文件");

  const brokenShell = {
    zh: { ...zh, education: { ...zh.education, items: undefined } },
    en: locales.en,
  };
  assert.throws(() => renderShell(brokenShell), /education\.items/);
  assert.throws(() => renderShell(brokenShell), /zh\.json/);
});
