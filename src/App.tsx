import { Suspense, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "react-i18next";
import { BrowserRouter as Router, Routes, Route, useLocation, useParams } from "react-router-dom";
import i18n, { type Lang } from "./i18n";
import {
  About,
  Album,
  ContactAdvanced,
  ErrorBoundary,
  Experience,
  GlobalLottieBackground,
  Hero,
  Navbar,
  Works,
} from "./components";
import Education from "./components/Education";
import Honors from "./components/Honors";
import Writing from "./components/Writing";
import Footer from "./components/Footer";
import ScrollToTopButton from "./components/ScrollToTop";
import LazyVisible from "./components/LazyVisible";
import { lazyWithReload } from "./lazyWithReload";

const Tools = lazyWithReload("Tools", () => import("./pages/Tools"));
const NotFound = lazyWithReload("NotFound", () => import("./pages/NotFound"));
const AlbumList = lazyWithReload("AlbumList", () => import("./pages/AlbumList"));
const AlbumDetail = lazyWithReload("AlbumDetail", () => import("./pages/AlbumDetail"));
const AlbumAdmin = lazyWithReload("AlbumAdmin", () => import("./pages/AlbumAdmin"));
const Admin = lazyWithReload("Admin", () => import("./pages/Admin"));
// 单独指向具体模块，绝不能经过 ./canvas 或 ./components 这两个 barrel —— 否则
// three.js 又会被拖回入口图（见 src/components/index.ts 顶部的注释）。
const StarsCanvas = lazyWithReload("Stars", () => import("./components/canvas/Stars"));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function HtmlLangSync() {
  const { i18n } = useTranslation();
  useEffect(() => {
    document.documentElement.lang = i18n.language === "zh" ? "zh-CN" : "en";
  }, [i18n.language]);
  return null;
}

// ponytail: only /zh and /en need a self-referencing canonical (the crawler-folding
function CanonicalSync() {
  const { pathname } = useLocation();
  useEffect(() => {
    // 每条路由都写自引用 canonical，不只是语言路由。/album 和 /album/:slug
    // 也在 sitemap 里，指向 / 会让它们被判为首页重复内容而永不收录。
    // 静态壳里没有这个标签（见 index.html），所以缺省时要创建。
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", `https://longsizhuo.com${pathname}`);
  }, [pathname]);
  return null;
}

function Analytics() {
  const location = useLocation();
  useEffect(() => {
    if (window.gtag) {
      window.gtag("config", "G-LWL6MY0GF4", {
        page_path: location.pathname,
      });
    }
  }, [location]);
  return null;
}

// 页面级兜底：区块级 boundary（canvas、Lottie）没接住的错误最终会冒泡到这里，
// 渲染一段可读文字而不是让整个 React root 被卸载、页面全黑。
function PageErrorFallback() {
  return (
    <div className="min-h-screen bg-primary flex items-center justify-center text-secondary">
      页面加载出错，请刷新重试。
    </div>
  );
}

// AlbumList/AlbumDetail throw during render when the API call fails (see
// those files) so this catches it instead of the generic PageErrorFallback —
// same idea, album-specific copy.
function AlbumErrorFallback() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-primary flex items-center justify-center text-secondary">
      {t("album.loadError")}
    </div>
  );
}

// /album/:slug is one Route, so navigating from album A straight to album B
// reuses the same ErrorBoundary instance instead of remounting it — if A's
// fetch had thrown, B would still render A's stale fallback until a full
// reload. Keying the boundary on the slug forces a remount on every route
// change, same as any other per-item state that must reset on navigation.
function AlbumDetailRoute() {
  const { slug } = useParams<{ slug: string }>();
  return (
    <ErrorBoundary key={slug} label="album-detail" fallback={<AlbumErrorFallback />}>
      <AlbumDetail />
    </ErrorBoundary>
  );
}

function LangRoute({ lang }: { lang: Lang }) {
  useEffect(() => {
    if (i18n.language !== lang) {
      i18n.changeLanguage(lang);
      localStorage.setItem("lang", lang);
    }
  }, [lang]);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
      <ErrorBoundary label="page" fallback={<PageErrorFallback />}>
        <HomePage />
      </ErrorBoundary>
    </motion.div>
  );
}

function HomePage() {
  return (
    <div className="relative z-0 bg-primary">
      <a href="#about" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-tertiary focus:text-white focus:rounded-lg">
        Skip to content
      </a>
      <ErrorBoundary label="lottie-background">
        <GlobalLottieBackground />
      </ErrorBoundary>
      <div className="bg-hero-pattern bg-cover bg-no-repeat bg-center">
        <Navbar />
        <Hero />
      </div>
      <About />
      <Album />
      <Experience />
      <Education />
      <Honors />
      <Works />
      <Writing />
      <div className="relative z-0">
        <ContactAdvanced />
        <ErrorBoundary label="stars-canvas">
          <LazyVisible>
            <Suspense fallback={null}>
              <StarsCanvas />
            </Suspense>
          </LazyVisible>
        </ErrorBoundary>
      </div>
      <Footer />
      <ScrollToTopButton />
    </div>
  );
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <HtmlLangSync />
      <CanonicalSync />
      <Analytics />
      <AnimatePresence mode="wait">
        <Suspense fallback={<div className="bg-primary min-h-screen" />}>
          <Routes>
            <Route path="/" element={
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                <ErrorBoundary label="page" fallback={<PageErrorFallback />}>
                  <HomePage />
                </ErrorBoundary>
              </motion.div>
            } />
            <Route path="/zh" element={<LangRoute lang="zh" />} />
            <Route path="/en" element={<LangRoute lang="en" />} />
            <Route path="/tools" element={
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                <ErrorBoundary label="page" fallback={<PageErrorFallback />}>
                  <Tools />
                </ErrorBoundary>
              </motion.div>
            } />
            <Route path="/album" element={
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                <ErrorBoundary label="album-list" fallback={<AlbumErrorFallback />}>
                  <AlbumList />
                </ErrorBoundary>
              </motion.div>
            } />
            {/* 后台总入口。/album/admin 是它的前身，只管相册；保留是因为
                Cloudflare Access 的保护路径里写着它，而且旧书签还在用。 */}
            <Route path="/admin" element={
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                <ErrorBoundary label="admin" fallback={<PageErrorFallback />}>
                  <Admin />
                </ErrorBoundary>
              </motion.div>
            } />
            <Route path="/album/admin" element={
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                <ErrorBoundary label="album-admin" fallback={<PageErrorFallback />}>
                  <AlbumAdmin />
                </ErrorBoundary>
              </motion.div>
            } />
            <Route path="/album/:slug" element={
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                <AlbumDetailRoute />
              </motion.div>
            } />
            <Route path="*" element={
              <ErrorBoundary label="page" fallback={<PageErrorFallback />}>
                <NotFound />
              </ErrorBoundary>
            } />
          </Routes>
        </Suspense>
      </AnimatePresence>
    </Router>
  );
}

export default App;
