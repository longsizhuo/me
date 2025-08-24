import React, { useState, useEffect } from "react";
import { logo_dark, logo_normal, drcvt } from "../assets/index.js";
import ProjectOverlay from "./ProjectOverlay.jsx";

const projects = [
  {
    name: "Spot Finder",
    logo: {
      light: logo_normal,
      dark: logo_dark,
    },
    description: "A parking space time-sharing rental system.",
    photos: [
      "/USYDCodingFest/Coding Fest 2024 AWARDS_-516.jpg",
      "/USYDCodingFest/Coding Fest 2024 AWARDS_-99.jpg",
      "/USYDCodingFest/Coding Fest 2024 AWARDS_-238.jpg",
      "/USYDCodingFest/Coding Fest 2024 STUDENTS_-48.jpg",
      "/USYDCodingFest/Coding Fest 2024 STUDENTS_-17.jpg",
      "/USYDCodingFest/Coding Fest 2024 STUDENTS_-124.jpg",
    ],
    githubUrl: null,
    liveUrl: "https://longsizhuo.com",
  },
  {
    name: "Hello-algo",
    logo: "/hello-algo-logo.svg", // 只有一个 logo，不支持深色模式
    description: "Simplifying data structures and algorithms with animations.",
    photos: ["/hello-algo-logo.svg"],
    githubUrl: "https://github.com/krahets/hello-algo",
    liveUrl: "https://hello-algo.com/en/",
  },
  {
    name: "Dimensionality Reduction Clustering Visualization Tool",
    logo: drcvt, // 只有一个 logo，不支持深色模式
    description: "A web-based tool for visualizing single-cell RNA-seq data.",
    photos: ["/DRCV.webp"],
    githubUrl: null,
    liveUrl: "https://longsizhuo.shinyapps.io/long/",
  },
];

const Projects = () => {
  const [theme, setTheme] = useState("light"); // 默认浅色主题
  const [selectedProject, setSelectedProject] = useState(null);

  // 监听系统主题变化
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setTheme(mediaQuery.matches ? "dark" : "light"); // 根据系统主题设置初始值

    const handleThemeChange = (e) => {
      setTheme(e.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleThemeChange); // 监听主题切换

    return () =>
      mediaQuery.removeEventListener("change", handleThemeChange); // 清理监听器
  }, []);

  const handleProjectClick = (project) => {
    setSelectedProject(project);
  };

  const handleClose = () => {
    setSelectedProject(null);
  };

  return (
    <section style={{ marginTop: "40px", marginBottom: null }}>
      <h2 style={{ color: "#333" }}>Projects</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {projects.map((project, index) => (
          <div
            key={index}
            style={{ display: "flex", alignItems: "center", cursor: "pointer" }}
            onClick={() => handleProjectClick(project)}
          >
            <div
              style={{
                minWidth: "200px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                marginRight: "20px",
              }}
            >
              <img
                src={
                  typeof project.logo === "string"
                    ? project.logo
                    : theme === "dark"
                    ? project.logo.dark
                    : project.logo.light
                }
                alt={`${project.name} logo`}
                style={{
                  maxWidth: project.name === "Hello-algo" ? "100px" : "200px", // 限制最大宽度为容器宽度
                  height: "auto", // 高度自动调整以保持比例
                }}
              />
            </div>
            <div className={"Name"}>
              <div
                style={{ color: "blue", fontSize: "18px", textDecoration: "none" }}
              >
                {project.name}
              </div>
              <p style={{ color: "#555", margin: 0 }}>{project.description}</p>
            </div>
          </div>
        ))}
      </div>
      <ProjectOverlay
        open={!!selectedProject}
        onClose={handleClose}
        onBack={handleClose}
        title={selectedProject?.name}
        description={selectedProject?.description}
        photos={selectedProject?.photos || []}
        githubUrl={selectedProject?.githubUrl}
        liveUrl={selectedProject?.liveUrl}
      />
    </section>
  );
};

export default Projects;

