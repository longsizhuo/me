// 区块的中文名。单独成文件是因为 ContentNode.tsx 只能导出组件 ——
// 混着导出常量会让 Vite 的快速刷新对整个模块失效（react-refresh 规则）。
const SECTION_LABELS: Record<string, string> = {
  nav: "导航栏",
  hero: "首屏",
  about: "关于我",
  album: "相册",
  experience: "工作经历",
  education: "教育背景",
  honors: "荣誉与专利",
  projects: "项目展示",
  writing: "写作",
  contact: "联系方式",
  tools: "工具页",
  footer: "页脚",
  notFound: "404 页面",
};

// 保留英文 key：管理页要和 src/i18n/*.json 对得上，只显示中文名会让人不知道
// 自己在改哪一段 JSON。
export function sectionLabel(key: string): string {
  return SECTION_LABELS[key] ? `${SECTION_LABELS[key]}（${key}）` : key;
}
