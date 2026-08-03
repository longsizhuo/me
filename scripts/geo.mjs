/**
 * GEO(Generative Engine Optimization)静态内容生成器。
 *
 * 背景：本站是纯 CSR 的 Vite + React SPA，nginx 对所有路径回落到同一个
 * index.html。2026-08 实测：AI 抓取管线读本站首页只拿得到 <title> 和
 * meta description —— <noscript> 里那段手写简介被正文提取器整段丢掉了。
 * 也就是说 ChatGPT / Perplexity / Claude 这类引擎除了标题一无所知，
 * 学历、奖项、经历它们全都看不见。
 *
 * 所以把事实生成进 #root：那是正常正文 DOM，任何提取器都读得到；
 * React 挂载时 createRoot 会把它整体替换掉，所以它同时又是首屏加载态
 * 和无 JS 兜底 —— 原来手写的 <noscript> 因此可以删掉，不留两份。
 *
 * 数据源只有 src/i18n/{zh,en}.json：站点本来就用它渲染，
 * .github/workflows/translate.yml 会自动把 zh 的新键翻进 en。
 * 这里一个事实都不复制，否则又多一份会漂移的副本。
 */
import { readFileSync } from "node:fs";

import { safeJsonLdString } from "./json-ld.mjs";

const SITE = "https://longsizhuo.com";
const EMAIL = "longsizhuo@gmail.com";

// i18n 里没有的联系方式/身份链接。和 index.html 原本 JSON-LD 的 sameAs 一致。
const LINKS = [
  ["GitHub", "https://github.com/longsizhuo"],
  ["LinkedIn", "https://linkedin.com/in/longsizhuo"],
  ["小红书", "https://www.xiaohongshu.com/user/profile/5c0b8cc2000000000601e809"],
  ["Steam", "https://steamcommunity.com/id/longsizhuo/"],
];

export function loadLocales() {
  const read = (f) => JSON.parse(readFileSync(new URL(`../src/i18n/${f}`, import.meta.url), "utf8"));
  return { zh: read("zh.json"), en: read("en.json") };
}

const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ESCAPES[c]);

const list = (items) => `<ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul>`;

// i18n array fields fall into two failure modes that must be handled
// differently. A key that isn't an array at all (undefined, or some other
// type) means the i18n file itself is malformed — e.g. the auto-translate
// CI wrote an en.json missing a whole section — and that must fail loudly,
// naming exactly what's missing, instead of surfacing three calls later as
// an unrelated "Cannot read properties of undefined" inside a Vite plugin.
// An array that's simply empty (a genuine "nothing here yet" state, or
// someone emptying it on purpose) is not an error — see `section()` below.
function arr(value, key, file) {
  if (!Array.isArray(value)) {
    throw new Error(
      `geo.mjs: "${key}" in src/i18n/${file} must be an array, got ${
        value === undefined ? "undefined (key is missing)" : typeof value
      }`,
    );
  }
  return value;
}

// items[0] stands in for "current role" in a few places. An empty array
// means there's nothing to derive that from — skip it, don't crash on
// `.title` of undefined.
const first = (items) => (items.length > 0 ? items[0] : null);

// One <h2> section, or nothing at all if there's no content for it —
// emptying the underlying array degrades to a missing section, not a
// broken build.
const section = (title, items, render) =>
  items.length > 0 ? `<h2>${esc(title)}</h2>${items.map(render).join("")}` : "";

/**
 * 生成注入 #root 的正文。React 挂载前它是加载态，挂载后被替换；
 * 关掉 JS 就一直是它。内容和 App 渲染出来的完全一致 —— 不是给爬虫
 * 单独准备的另一套，那是 cloaking。
 */
export function renderShell({ zh, en }) {
  const experienceItems = arr(zh.experience.items, "experience.items", "zh.json");
  const educationItems = arr(zh.education.items, "education.items", "zh.json");
  const honorsItems = arr(zh.honors.items, "honors.items", "zh.json");
  const projectsItems = arr(zh.projects.staticItems, "projects.staticItems", "zh.json");
  const enExperienceItems = arr(en.experience.items, "experience.items", "en.json");
  const enHonorsItems = arr(en.honors.items, "honors.items", "en.json");
  const cur = first(experienceItems);
  const enCur = first(enExperienceItems);

  const sections = [
    `<h2>关于</h2><p>${esc(zh.about.description)}</p>`,

    section(zh.experience.title, experienceItems, (e) =>
      `<article><h3>${esc(e.title)} · ${esc(e.company)}</h3>` +
      `<p class="geo-meta">${esc(e.date)}</p>` +
      list(e.points.map(esc)) +
      `</article>`,
    ),

    section(zh.education.title, educationItems, (e) =>
      `<article><h3>${esc(e.degree)} · ${esc(e.university)}</h3>` +
      `<p class="geo-meta">${esc(e.duration)}</p>` +
      `<p>主修课程：${esc(e.coursework)}</p></article>`,
    ),

    section(zh.honors.title, honorsItems, (h) =>
      `<article><h3>${esc(h.title)}</h3>` +
      `<p class="geo-meta">${esc(h.issuer)} · ${esc(h.date)}</p>` +
      `<p>${esc(h.description)}</p></article>`,
    ),

    section(zh.projects.title, projectsItems, (p) =>
      `<article><h3><a href="${esc(p.source_code_link)}">${esc(p.name)}</a></h3>` +
      `<p>${esc(p.description)}</p></article>`,
    ),

    `<h2>${esc(zh.writing.title)}</h2><p>${esc(
      zh.writing.description_prefix + zh.writing.xhs_label + zh.writing.description_middle + zh.writing.blog_label,
    )}。</p>`,

    `<h2>联系</h2>` +
      list([
        `Email：<a href="mailto:${EMAIL}">${EMAIL}</a>`,
        ...LINKS.map(([name, url]) => `${esc(name)}：<a href="${esc(url)}" rel="me">${esc(url)}</a>`),
      ]),

    // 英文只给摘要，不镜像全文：标题、meta、JSON-LD 已经带英文别名，
    // 模型跨语言 grounding 没问题，多一份全文只是让首屏白白重一倍。
    `<section lang="en"><h2>English summary</h2><p>${esc(en.hero.bio)}</p><p>${esc(en.about.description)}</p>` +
      (enCur
        ? `<p>Currently ${esc(enCur.title)} at ${esc(enCur.company)} (${esc(enCur.date)}).</p>`
        : "") +
      list(enHonorsItems.map((h) => `${esc(h.title)} — ${esc(h.issuer)}, ${esc(h.date)}`)) +
      `</section>`,
  ];

  return (
    `<div class="geo-shell">` +
    `<h1>${esc(zh.hero.name)} (Sizhuo Long)</h1>` +
    (cur
      ? `<p class="geo-role">${esc(cur.title)} · ${esc(cur.company)} · 北京 — Frontend Engineer at Kuaishou Technology, Beijing</p>`
      : "") +
    `<p>${esc(zh.hero.bio)}</p>` +
    sections.join("") +
    `</div>`
  );
}

/**
 * #root 里那段内容的样式。挂载后连同内容一起被 React 丢掉。
 * body 背景要在这里兜一份：index.css 是 main.jsx import 进来的，
 * JS 没跑完之前页面是白底，深色文字上去就看不清了。
 */
export const SHELL_STYLE =
  `body{background:#050816;margin:0}` +
  `.geo-shell{max-width:760px;margin:0 auto;padding:3rem 1.5rem;color:#aaa6c3;` +
  `font-family:Inter,system-ui,sans-serif;line-height:1.8}` +
  `.geo-shell h1{color:#f7f8f8;font-size:2rem;margin:0 0 .5rem}` +
  `.geo-shell h2{color:#f7f8f8;font-size:1.25rem;margin:2.5rem 0 .75rem}` +
  `.geo-shell h3{color:#f7f8f8;font-size:1rem;margin:1.5rem 0 .25rem}` +
  `.geo-shell .geo-role{color:#915eff;font-size:1.05rem;margin:0 0 1.5rem}` +
  `.geo-shell .geo-meta{color:#7d7896;font-size:.9rem;margin:0 0 .5rem}` +
  `.geo-shell a{color:#915eff}` +
  `.geo-shell ul{padding-left:1.2rem;margin:.5rem 0}`;

/**
 * Schema.org Person。AI 引擎直接吃结构化数据，所以奖项、学历这些
 * 也从 i18n 生成 —— 手写的话加一个奖就得改两处。
 */
export function renderJsonLd({ zh, en }) {
  const enExperienceItems = arr(en.experience.items, "experience.items", "en.json");
  const enEducationItems = arr(en.education.items, "education.items", "en.json");
  const zhHonorsItems = arr(zh.honors.items, "honors.items", "zh.json");
  const cur = first(enExperienceItems);
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: zh.hero.name,
    alternateName: ["Sizhuo Long", "Siz Long", "Long Sizhuo", "Loong Loong"],
    url: SITE,
    image: `${SITE}/avatar.png`,
    email: `mailto:${EMAIL}`,
    description: en.hero.bio,
    // Omitted entirely (JSON.stringify drops an undefined value) rather
    // than crashing when there's no current experience entry to derive it
    // from — same "skip, don't break the build" treatment as every other
    // section here.
    jobTitle: cur ? cur.title : undefined,
    worksFor: {
      "@type": "Organization",
      name: "快手科技",
      alternateName: ["Kuaishou Technology", "Kwai"],
    },
    workLocation: { "@type": "Place", name: "Beijing, China" },
    alumniOf: enEducationItems.map((e) => ({
      "@type": "EducationalOrganization",
      name: e.university,
    })),
    hasCredential: enEducationItems.map((e) => ({
      "@type": "EducationalOccupationalCredential",
      name: e.degree,
      educationalLevel: "Master's degree",
      recognizedBy: { "@type": "EducationalOrganization", name: e.university },
    })),
    award: zhHonorsItems.map((h) => `${h.title}（${h.issuer}，${h.date}）`),
    knowsAbout: ["React", "TypeScript", "Python", "Golang", "Three.js", "Animation", "Frontend Development"],
    sameAs: LINKS.map(([, url]) => url),
  };
}

/**
 * llms.txt —— AI 抓取方约定的入口文件。首页正文已经够用，这个是低成本
 * 补充：纯文本、无标记噪音，事实密度最高的一份。
 */
export function renderLlmsTxt({ zh, en }) {
  const experienceItems = arr(zh.experience.items, "experience.items", "zh.json");
  const educationItems = arr(zh.education.items, "education.items", "zh.json");
  const honorsItems = arr(zh.honors.items, "honors.items", "zh.json");
  const projectsItems = arr(zh.projects.staticItems, "projects.staticItems", "zh.json");
  const enHonorsItems = arr(en.honors.items, "honors.items", "en.json");
  const cur = first(experienceItems);
  const out = [
    `# ${zh.hero.name} (Sizhuo Long)`,
    ``,
    `> ${zh.hero.bio}`,
    ``,
    `本文件是 ${SITE} 的机器可读摘要，内容由站点 i18n 数据生成，与页面一致。`,
    ``,
    `## 速览`,
    ...(cur ? [`- 现职：${cur.title}，${cur.company}（${cur.date}），北京`] : []),
    ...educationItems.map((e) => `- 教育：${e.degree}，${e.university}（${e.duration}）`),
    `- Email：${EMAIL}`,
    ``,
    ...(experienceItems.length > 0
      ? [
          `## ${zh.experience.title}`,
          ...experienceItems.flatMap((e) => [``, `### ${e.title} · ${e.company}`, `${e.date}`, ...e.points.map((p) => `- ${p}`)]),
          ``,
        ]
      : []),
    ...(educationItems.length > 0
      ? [
          `## ${zh.education.title}`,
          ...educationItems.flatMap((e) => [``, `### ${e.degree} · ${e.university}`, `${e.duration}`, `主修课程：${e.coursework}`]),
          ``,
        ]
      : []),
    ...(honorsItems.length > 0
      ? [`## ${zh.honors.title}`, ...honorsItems.map((h) => `- ${h.title} —— ${h.issuer}，${h.date}。${h.description}`), ``]
      : []),
    ...(projectsItems.length > 0
      ? [`## ${zh.projects.title}`, ...projectsItems.map((p) => `- [${p.name}](${p.source_code_link})：${p.description}`), ``]
      : []),
    `## English summary`,
    ``,
    en.about.description,
    ``,
    ...enHonorsItems.map((h) => `- ${h.title} — ${h.issuer}, ${h.date}`),
    ``,
    `## 链接`,
    ...LINKS.map(([name, url]) => `- [${name}](${url})`),
    ``,
  ];
  return out.join("\n");
}

/**
 * Vite 插件：把上面三样注入构建产物。
 * index.html 里只留 <!--geo--> 和 <!--geo-jsonld--> 两个占位符，
 * 事实一律不落在 HTML 源码里。
 */
export function geo() {
  // transformIndexHtml and generateBundle both need the locales, and used to
  // each call loadLocales() independently — if src/i18n/*.json changed
  // between the two hook calls (a build isn't instantaneous), the #root
  // body and llms.txt could be built from two different snapshots of the
  // same "source of truth". One read per build, shared between hooks.
  let cachedLocales = null;
  const locales = () => (cachedLocales ??= loadLocales());

  return {
    name: "geo",
    transformIndexHtml: {
      order: "pre",
      handler(html) {
        const data = locales();
        const jsonLd = safeJsonLdString(renderJsonLd(data));
        return html
          // 用替换函数而不是替换字符串：替换内容由 i18n 文案生成，其中的
            // $& / $` / $\u0027 / $$ 在字符串形式下会被当成替换模式展开。
            .replace("<!--geo-jsonld-->", () => `<script type="application/ld+json">\n${jsonLd}\n</script>`)
          .replace("<!--geo-->", () => `<style>${SHELL_STYLE}</style>${renderShell(data)}`);
      },
    },
    generateBundle() {
      this.emitFile({ type: "asset", fileName: "llms.txt", source: renderLlmsTxt(locales()) });
    },
  };
}
