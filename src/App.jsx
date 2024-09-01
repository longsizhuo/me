import React from 'react';
import Profile from './components/Profile';
import Projects from './components/Projects';
import Education from './components/Education';
import Experience from './components/Experience';
import Achievements from './components/Achievements';
import GitHubCard from './components/GitHubCard';
import {BrowserRouter as Router, Routes, Route} from "react-router-dom";
import SpotFinder from "./Projects/spot-finder.jsx";
import HelloAlgo from "./Projects/hello-algo.jsx";
import VisualizationTool from "./Projects/visualization-tool.jsx";

function App() {
    const appStyle = {
        fontFamily: 'Arial, sans-serif',
        margin: '20px'
    };

    return (
        <Router>
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
        </Router>
    );
}

export default App;
