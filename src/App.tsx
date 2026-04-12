import { lazy, Suspense, useEffect } from "react";
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
import Footer from "./components/Footer";

const Tools = lazy(() => import("./pages/Tools"));

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
      <div className="relative z-0">
        <ContactAdvanced />
        <StarsCanvas />
      </div>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Analytics />
      <Suspense fallback={<div className="bg-primary min-h-screen" />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/tools" element={<Tools />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
