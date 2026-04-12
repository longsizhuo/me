import { lazy, Suspense, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import {
  About,
  Album,
  ContactAdvanced,
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

function HomePage() {
  return (
    <div className="relative z-0 bg-primary">
      <GlobalLottieBackground />
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
        <StarsCanvas />
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
      <Analytics />
      <AnimatePresence mode="wait">
        <Suspense fallback={<div className="bg-primary min-h-screen" />}>
          <Routes>
            <Route path="/" element={
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                <HomePage />
              </motion.div>
            } />
            <Route path="/tools" element={
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                <Tools />
              </motion.div>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AnimatePresence>
    </Router>
  );
}

export default App;
