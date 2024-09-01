import React from 'react';
import { Link } from 'react-router-dom'; // 用于导航到项目详情页面

const projects = [
    {
        name: "Spot Finder",
        logo: "public/vite.svg",
        description: "A parking space time-sharing rental system.",
        link: "spot-finder"
    },
    {
        name: "Hello-algo",
        logo: "public/vite.svg",
        description: "Simplifying data structures and algorithms with animations.",
        link: "hello-algo"
    },
    {
        name: "Dimensionality Reduction Clustering Visualization Tool",
        logo: "public/vite.svg",
        description: "A web-based tool for visualizing single-cell RNA-seq data.",
        link: "visualization-tool"
    }
];

const Projects = () => {
    return (
        <section style={{ marginBottom: '40px' }}>
            <h2 style={{ color: '#333' }}>Projects</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {projects.map((project, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center' }}>
                        <img src={project.logo} alt={`${project.name} logo`} style={{ width: '50px', marginRight: '20px' }} />
                        <div>
                            <Link to={project.link} style={{ color: '#333', fontSize: '18px', textDecoration: 'none' }}>
                                {project.name}
                            </Link>
                            <p style={{ color: '#555' }}>{project.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default Projects;
