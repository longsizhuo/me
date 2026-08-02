import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en.json";
import zh from "./zh.json";

export type Lang = "zh" | "en";

/** URL 首段是 /zh 或 /en 时返回对应语言，否则 null */
export function langFromPath(pathname: string): Lang | null {
  const seg = pathname.split("/")[1];
  return seg === "zh" || seg === "en" ? seg : null;
}

/**
 * 优先级：URL > localStorage > 英文。
 *
 * 刻意不看 navigator.language：默认英文是站点定位选择，不是技术妥协 ——
 * 中文访客走 /zh 或按一次语言切换（会记进 localStorage）。
 *
 * 这只影响渲染语言。index.html 的静态 title / description / noscript
 * 保持中文优先不变 —— 那是百度唯一抓得到的内容，也是「龙思卓」能被
 * 搜到的前提。两件事互不冲突。
 */
function resolveLang(): Lang {
  if (typeof window === "undefined") {
    return "en";
  }
  const fromPath = langFromPath(window.location.pathname);
  if (fromPath) {
    return fromPath;
  }
  const saved = localStorage.getItem("lang");
  if (saved === "zh" || saved === "en") {
    return saved;
  }
  return "en";
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    zh: { translation: zh },
  },
  lng: resolveLang(),
  fallbackLng: "zh",
  interpolation: { escapeValue: false },
  returnObjects: true,
});

export default i18n;
