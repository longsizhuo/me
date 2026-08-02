import { lazy, Suspense, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "react-i18next";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import i18n, { type Lang, langFromPath } from "./i18n";
import {
  About,
  Album,
  ContactAdvanced,
  ErrorBoundary,
  Experience,
  GlobalLottieBackground,
  Hero,
  Navbar,
  StarsCanvas,
  Works,
} from "./components";
import Education from "./components/Education";
import Honors from "./components/Honors";
import Writing from "./components/Writing";
import Footer from "./components/Footer";
import ScrollToTopButton from "./components/ScrollToTop";

const Tools = lazy(() => import("./pages/Tools"));
const NotFound = lazy(() => import("./pages/NotFound"));

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
// risk this exists for); everything else keeps the static shell's default of "/".
function CanonicalSync() {
  const { pathname } = useLocation();
  useEffect(() => {
    const canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      return;
    }
    const lang = langFromPath(pathname);
    canonical.setAttribute("href", `https://longsizhuo.com${lang ? pathname : "/"}`);
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
          <StarsCanvas />
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
