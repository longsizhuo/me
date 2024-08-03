import React from 'react';

const Projects = () => {
    const sectionStyle = {
        marginBottom: '40px'
    };
    const headingStyle = {
        color: '#333'
    };
    const paragraphStyle = {
        color: '#555'
    };

    return (
        <section style={sectionStyle}>
            <h2 style={headingStyle}>Projects</h2>
            <div>
                <h3 style={headingStyle}>Spot Finder</h3>
                <p style={paragraphStyle}><strong>Role:</strong> Scrum Master | Click: 4k+</p>
                <p style={paragraphStyle}>
                    Led a team to devise an urban parking space time-sharing rental system, addressing parking problems for travellers and increasing income for parking space owners.
                </p>
                <p style={paragraphStyle}>
                    <strong>Achievements:</strong><br/>
                    Achieved a project score of 95/100; selected for USYD Coding Fest and UNSW Incubator Peter Farrell Cup.<br/>
                    Won the Outstanding Project Idea Award Champion in the USYD Coding Fest 2024.
                </p>
            </div>

            <div>
                <h3 style={headingStyle}>Hello-algo</h3>
                <p style={paragraphStyle}><strong>Role:</strong> Core Contributor | Starred by 89.3K users</p>
                <p style={paragraphStyle}>
                    Summarized all the chapters of "Hello Algo," simplifying data structures and algorithms through visual animations for learners in multiple programming languages.
                </p>
                <p style={paragraphStyle}>
                    <strong>Achievements:</strong><br/>
                    Attracted 89.3K stars on GitHub, indicating widespread recognition and appreciation in the developer community.<br/>
                    Sold over 50,000 copies of the physical book and received 99% positive reviews.
                </p>
            </div>

            <div>
                <h3 style={headingStyle}>Dimensionality Reduction Clustering Visualization Tool</h3>
                <p style={paragraphStyle}><strong>Role:</strong> Project Architect</p>
                <p style={paragraphStyle}>
                    Developed an innovative web-based tool in R, aimed at simplifying analysis of single-cell RNA-seq data through intuitive visualization of dimensionality reduction and clustering techniques.
                </p>
                <p style={paragraphStyle}>
                    <strong>Achievements:</strong><br/>
                    Recognized Computer software copyright certificate (No. 7903259) by the National Copyright Administration of China.
                </p>
            </div>
        </section>
    );
};

export default Projects;
