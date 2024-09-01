// import React from 'react';
// import { Link } from 'react-router-dom'; // 引入 Link 组件用于路由跳转
//
// const Project = () => {
//     const sectionStyle = {
//         marginBottom: '40px'
//     };
//     const projectStyle = {
//         display: 'flex',
//         alignItems: 'center',
//         marginBottom: '20px',
//         textDecoration: 'none',
//         color: 'inherit'
//     };
//     const logoStyle = {
//         width: '50px',
//         height: '50px',
//         marginRight: '15px'
//     };
//     const projectNameStyle = {
//         fontSize: '24px',
//         margin: '0'
//     };
//     const descriptionStyle = {
//         marginTop: '5px',
//         color: '#555'
//     };
//
//     return (
//         <section style={sectionStyle}>
//             <h2>Projects</h2>
//
//             <Link to="/projects/spot-finder" style={projectStyle}>
//                 <img src="/path/to/spotfinder-logo.png" alt="Spot Finder Logo" style={logoStyle} />
//                 <div>
//                     <h3 style={projectNameStyle}>Spot Finder</h3>
//                     <p style={descriptionStyle}>Urban parking space time-sharing rental system.</p>
//                 </div>
//             </Link>
//
//             <Link to="/projects/hello-algo" style={projectStyle}>
//                 <img src="/path/to/hello-algo-logo.png" alt="Hello-algo Logo" style={logoStyle} />
//                 <div>
//                     <h3 style={projectNameStyle}>Hello-algo</h3>
//                     <p style={descriptionStyle}>Simplifying data structures and algorithms through visual animations.</p>
//                 </div>
//             </Link>
//
//             <Link to="/projects/dimensionality-reduction" style={projectStyle}>
//                 <img src="/path/to/dimensionality-reduction-logo.png" alt="Dimensionality Reduction Tool Logo" style={logoStyle} />
//                 <div>
//                     <h3 style={projectNameStyle}>Dimensionality Reduction Clustering Visualization Tool</h3>
//                     <p style={descriptionStyle}>Web-based tool for single-cell RNA-seq data analysis.</p>
//                 </div>
//             </Link>
//         </section>
//     );
// };
//
// export default Project;