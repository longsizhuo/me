import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // 用于导航到项目详情页面

const projects = [
    {
        name: "Spot Finder",
        logo: {
            light: "public/SpotFinder/logo3.svg",
            dark: "public/SpotFinder/logo4.svg"
        },
        description: "A parking space time-sharing rental system.",
        link: "spot-finder"
    },
    {
        name: "Hello-algo",
        logo: "https://www.hello-algo.com/assets/images/logo.svg", // 只有一个 logo，不支持深色模式
        description: "Simplifying data structures and algorithms with animations.",
        link: "hello-algo"
    },
    {
        name: "Dimensionality Reduction Clustering Visualization Tool",
        logo: "public/1234.webp", // 只有一个 logo，不支持深色模式
        description: "A web-based tool for visualizing single-cell RNA-seq data.",
        link: "visualization-tool"
    }
];

const Projects = () => {
    const [theme, setTheme] = useState('light'); // 默认浅色主题

    // 监听系统主题变化
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        setTheme(mediaQuery.matches ? 'dark' : 'light'); // 根据系统主题设置初始值

        const handleThemeChange = (e) => {
            setTheme(e.matches ? 'dark' : 'light');
        };

        mediaQuery.addEventListener('change', handleThemeChange); // 监听主题切换

        return () => mediaQuery.removeEventListener('change', handleThemeChange); // 清理监听器
    }, []);

    return (
        <section style={{ marginTop: '40px', marginBottom: null }}>
            <h2 style={{ color: '#333' }}>Projects</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {projects.map((project, index) => (
                    <Link to={project.link} key={index} style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{ minWidth: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginRight: '20px' }}>
                            <img
                                src={
                                    typeof project.logo === 'string'
                                        ? project.logo // 如果只有一个 logo，直接使用它
                                        : theme === 'dark'
                                            ? project.logo.dark // 如果有多种主题 logo，选择对应的
                                            : project.logo.light
                                }
                                alt={`${project.name} logo`}
                                style={{
                                    maxWidth: project.name === "Hello-algo"? '100px': '200px', // 限制最大宽度为容器宽度
                                    height: 'auto', // 高度自动调整以保持比例
                                }}
                            />
                        </div>
                        <div className={"Name"}>
                            <div style={{ color: 'blue', fontSize: '18px', textDecoration: 'none' }}>
                                {project.name}
                            </div>
                            <p style={{ color: '#555', margin: 0 }}>{project.description}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
};

export default Projects;
