
const Experience = () => {
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
            <h2 style={headingStyle}>Experience</h2>
            <div>
                <h3 style={headingStyle}>Gem Flower Healthcare Information Technology Ltd.</h3>
                <p style={paragraphStyle}><strong>Role:</strong> Research & Development Intern, Product Development Department</p>
                <p style={paragraphStyle}><strong>Duration:</strong> Jan 2021 - Apr 2021</p>
                <p style={paragraphStyle}>
                    Assisted tutor in hospital system maintenance and code testing, performing duties similar to a mobile task force by addressing issues across various departments.
                </p>
                <p style={paragraphStyle}>
                    Developed and executed test plans, test cases, and test scripts to ensure the quality and functionality of new features.
                </p>
                <p style={paragraphStyle}>
                    Collaborated with cross-functional teams to gather and analyze user requirements, translating them into actionable development tasks.
                </p>
                <p style={paragraphStyle}>
                    Strengthened sales and marketing efforts by providing technical insights and support, increasing project engagement and customer acquisition.
                </p>
            </div>
        </section>
    );
};

export default Experience;
