import React, {useEffect} from 'react';
import {BrowserRouter as Router, Routes, Route, useLocation} from "react-router-dom";
import Profile from './components/Profile';
import Projects from './components/Projects';
import Education from './components/Education';
import Experience from './components/Experience';
import Achievements from './components/Achievements';
import GitHubCard from './components/GitHubCard';
import SpotFinder from "./Projects/spot-finder.jsx";
import HelloAlgo from "./Projects/hello-algo.jsx";
import VisualizationTool from "./Projects/visualization-tool.jsx";

function AppContent() {
    const appStyle = {
        fontFamily: 'Arial, sans-serif',
        margin: '20px'
    };
    const location = useLocation();

    useEffect(() => {
        if (window.gtag) {
            window.gtag('config', 'G-LWL6MY0GF4', {
                page_path: location.pathname,
            });
        }
    }, [location]);

    return (
        <div className="App" style={appStyle}>
            <Routes>
                <Route path={"/"} element={
                    <>
                        <Profile />
                        <GitHubCard />
                        <Projects />
                        <Education />
                        <Experience />
                        <Achievements />
                    </>
                } />
                <Route path="spot-finder" element={<SpotFinder />} />
                <Route path="hello-algo" element={<HelloAlgo />} />
                <Route path="visualization-tool" element={<VisualizationTool />} />
            </Routes>
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
