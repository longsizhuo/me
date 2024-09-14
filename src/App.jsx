import React, {useEffect} from 'react';
import {BrowserRouter as Router, Routes, Route, useLocation, BrowserRouter} from "react-router-dom";
import Profile from './components/Profile';
import Projects from './components/Projects';
import Education from './components/Education';
// import Experience from './components/Experience';
import Achievements from './components/Achievements';
import GitHubCard from './components/GitHubCard';
import SpotFinder from "./Projects/spot-finder.jsx";
import HelloAlgo from "./Projects/hello-algo.jsx";
import VisualizationTool from "./Projects/visualization-tool.jsx";
import { About, Contact, Experience, Feedbacks, Hero, Navbar, Tech, Works, StarsCanvas } from "./components";
function AppContent() {
    const [theme, setTheme] = React.useState('dark');
    useEffect(() => {
        document.documentElement.className = theme;
    }, [theme]);

    const location = useLocation();

    // 切换白天和黑夜模式
    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    useEffect(() => {
        if (window.gtag) {
            window.gtag('config', 'G-LWL6MY0GF4', {
                page_path: location.pathname,
            });
        }
    }, [location]);

    return (
            <div className="relative z-0 bg-primary">
                <div className={"bg-hero-pattern bg-cover bg-no-repeat bg-center"}>
                    <Navbar />
                    <Hero />
                </div>
                <About />
                <Experience />
                <Tech />
                <Works />
                <Feedbacks />
                <div className={"relative z-0"}>
                    <Contact />
                    <StarsCanvas />
                </div>
            </div>
        // <div className="App" style={appStyle}>
        //     <Routes>
        //         <Route path={"/"} element={
        //             <>
        //                 <Profile />
        //                 <GitHubCard />
        //                 <Projects />
        //                 <Education />
        //                 <Experience />
        //                 <Achievements />
        //             </>
        //         } />
        //         <Route path="spot-finder" element={<SpotFinder />} />
        //         <Route path="hello-algo" element={<HelloAlgo />} />
        //         <Route path="visualization-tool" element={<VisualizationTool />} />
        //     </Routes>
        // </div>
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
