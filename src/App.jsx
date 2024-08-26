import React from 'react';
import Profile from './components/Profile';
import Projects from './components/Projects';
import Education from './components/Education';
import Experience from './components/Experience';
import Achievements from './components/Achievements';
import GitHubCard from './components/GitHubCard';

function App() {
    const appStyle = {
        fontFamily: 'Arial, sans-serif',
        margin: '20px'
    };

    return (
        <div className="App" style={appStyle}>
            {/*<header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>*/}
            {/*    <h1>Sizhuo Long's Website</h1>*/}
            {/*    <MyAvatar />*/}
            {/*</header>*/}
            <Profile />
            <GitHubCard />
            <Projects />
            <Education />
            <Experience />
            <Achievements />
        </div>
    );
}

export default App;
