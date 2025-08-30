import React from 'react';

const Achievements = () => {
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
            <h2 style={headingStyle}>Achievements</h2>
            <div>
                <h3 style={headingStyle}>Champion of USYD Coding Fest</h3>
                <p style={paragraphStyle}><strong>Date:</strong> July 2024</p>
                <p style={paragraphStyle}>Represented UNSW in the USYD Coding Fest 2024, a prestigious competition hosted by the University of Sydney that brings together top computer science students to solve real-world problems. Won the Outstanding Project Idea Award.</p>
            </div>

            <div>
                <h3 style={headingStyle}>Lanqiao Cup, 1st Place</h3>
                <p style={paragraphStyle}><strong>Date:</strong> Apr 2024</p>
                <p style={paragraphStyle}>Achieved first place in the International Python Algorithm Postgraduate/A category at the 15th Lanqiao Cup.</p>
            </div>

            <div>
                <h3 style={headingStyle}>Academic Scholarship</h3>
                <p style={paragraphStyle}><strong>Date:</strong> Apr 2021</p>
                <p style={paragraphStyle}>Secured second rank in academic performance, awarded an academic excellence scholarship valued at 2,000 CNY.</p>
            </div>
        </section>
    );
};

export default Achievements;
