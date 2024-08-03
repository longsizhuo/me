import React from 'react';

const Education = () => {
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
            <h2 style={headingStyle}>Education</h2>
            <div>
                <h3 style={headingStyle}>The University of New South Wales</h3>
                <p style={paragraphStyle}><strong>Duration:</strong> Sep 2022 - Aug 2024</p>
                <p style={paragraphStyle}><strong>Degree:</strong> Master of Information Technology, WAM: Distinction</p>
                <p style={paragraphStyle}><strong>Relevant Coursework:</strong> Data Structures & Algorithms, Computer Vision, Web Front-End Programming, Computer Networks Applications, Blockchain App Architecture.</p>
            </div>

            <div>
                <h3 style={headingStyle}>Chengdu University of Information Technology (CUIT)</h3>
                <p style={paragraphStyle}><strong>Duration:</strong> Sep 2017 - May 2021</p>
                <p style={paragraphStyle}><strong>Degree:</strong> Bachelor of Digital Media Technology</p>
                <p style={paragraphStyle}><strong>Relevant Coursework:</strong> Advanced Graphics Programming (OpenGL), Network Game Programming Techniques.</p>
            </div>
        </section>
    );
};

export default Education;
