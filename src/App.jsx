import { useEffect } from "react";
import { BrowserRouter as Router, useLocation } from "react-router-dom";
import {
  About,
  Album,
  ContactAdvanced,
  Experience,
  GlobalLottieBackground,
  Hero,
  Navbar,
  StarsCanvas,
  VideoToAscii,
  Works,
} from "./components";
import Education from "./components/Education";
import HelloAlgo from "./Projects/hello-algo";
import SpotFinder from "./Projects/spot-finder";
import VisualizationTool from "./Projects/visualization-tool";

function AppContent() {
  const location = useLocation();

  useEffect(() => {
    if (window.gtag) {
      window.gtag("config", "G-LWL6MY0GF4", {
        page_path: location.pathname,
      });
    }
  }, [location]);

  return (
    <div className="relative z-0 bg-primary">
      <GlobalLottieBackground />
      <div className={"bg-hero-pattern bg-cover bg-no-repeat bg-center"}>
        <Navbar />
        <Hero />
      </div>
      <About />
      <Album />
      {/*<GitHubCard />*/}
      <Experience />
      <Education />
      {/* <Tech /> */}
      <Works />
      <VideoToAscii />
      {/* <Feedbacks /> */}
      <div className={"relative z-0"}>
        <ContactAdvanced />
        <StarsCanvas />
      </div>
      <HelloAlgo />
      <SpotFinder />
      <VisualizationTool />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
