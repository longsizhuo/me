import {useEffect} from 'react';
import {BrowserRouter as Router, useLocation} from "react-router-dom";
import Education from './components/Education';
import { About, ContactAdvanced, Experience, Hero, Navbar, Works, StarsCanvas, GlobalLottieBackground } from "./components";
function AppContent() {
    const location = useLocation();

    useEffect(() => {
        if (window.gtag) {
            window.gtag('config', 'G-LWL6MY0GF4', {
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
                {/*<GitHubCard />*/}
                <Experience />
                <Education />
                {/* <Tech /> */}
                <Works />
                {/* <Feedbacks /> */}
                <div className={"relative z-0"}>
                    <ContactAdvanced />
                    <StarsCanvas />
                </div>
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
