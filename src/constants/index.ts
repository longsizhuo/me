import {
    mobile,
    backend,
    creator,
    web,
    javascript,
    typescript,
    html,
    css,
    reactjs,
    redux,
    tailwind,
    nodejs,
    mongodb,
    git,
    figma,
    docker,
    bsh,
    threejs, unsw, spotFinder,
} from "../assets";
import spotFinderLogo from "../assets/SpotFinder/logo.svg";
import drcvt from "../assets/1234.webp";
import kwai from "../assets/kwai-vector-logo-seeklogo/kwai.png";

export const navLinks = [
    {
        id: "about",
        title: "About",
    },
    {
        id: "album",
        title: "Album",
    },
    {
        id: "work",
        title: "Work",
    },
    {
        id: "education",
        title: "Education",
    },
    {
        id: "honors",
        title: "Honors",
    },
    {
        id: "projects",
        title: "Projects",
    },
    {
        id: "contact",
        title: "Contact",
    },
];

const services = [
    {
        title: "Web Developer",
        icon: web,
    },
    {
        title: "React Native Developer",
        icon: mobile,
    },
    {
        title: "Backend Developer",
        icon: backend,
    },
    {
        title: "Content Creator",
        icon: creator,
    },
];

const technologies = [
    {
        name: "HTML 5",
        icon: html,
    },
    {
        name: "CSS 3",
        icon: css,
    },
    {
        name: "JavaScript",
        icon: javascript,
    },
    {
        name: "TypeScript",
        icon: typescript,
    },
    {
        name: "React JS",
        icon: reactjs,
    },
    {
        name: "Redux Toolkit",
        icon: redux,
    },
    {
        name: "Tailwind CSS",
        icon: tailwind,
    },
    {
        name: "Node JS",
        icon: nodejs,
    },
    {
        name: "MongoDB",
        icon: mongodb,
    },
    {
        name: "Three JS",
        icon: threejs,
    },
    {
        name: "git",
        icon: git,
    },
    {
        name: "figma",
        icon: figma,
    },
    {
        name: "docker",
        icon: docker,
    },
];

const experiences = [
    {
        title: "Frontend Engineer",
        company_name: "Kuaishou Technology (Kwai)",
        icon: kwai,
        iconBg: "#FFF",
        date: "May 2025 - Present",
        points: [
            "Building engaging, high-performance user experiences at scale for Kuaishou's web platform in Beijing HQ.",
            "Focused on animation infrastructure — designing and optimizing reusable animation modules using SVG, CSS Keyframes, and Lottie.",
            "Collaborated with designers and engineers to deliver smooth, resource-friendly animation effects across teams.",
            "Received 'A' Performance rating. Passionate about rendering performance, accessibility, and maintainability."
        ],
    },
    {
        title: "Casual Academic — COMP9021 & COMP3900/9900",
        company_name: "University of New South Wales",
        icon: unsw,
        iconBg: "#FFF",
        date: "Aug 2024 - May 2025",
        points: [
            "Taught Principles of Programming (COMP9021) and guided student teams in Computer Science Project (COMP3900/9900).",
            "Led students through agile development with Scrum — Sprint planning, daily standups, iterative development, and retrospectives.",
            "Managed project tracking on Jira, assisting with task decomposition, prioritization, and problem-solving.",
            "Provided targeted academic feedback to improve project quality and delivery outcomes."
        ],
    },
    {
        title: "Scrum Master & Backend Developer",
        company_name: "Spot Finder",
        icon: spotFinder,
        iconBg: "#000",
        date: "Jan 2024 - Present",
        points: [
            "Led the development of a parking space time-sharing rental system using Golang and MySQL.",
            "Managed the deployment of the backend using Docker, Cloudflare, Redis, and Nginx.",
            "Supervised team tasks, ensuring milestone achievement and project quality.",
            "Implemented WebSocket for real-time communication and offline messaging."
        ],
    },
    {
        title: "Research & Development Intern",
        company_name: "Gem Flower Healthcare Information Technology Ltd.",
        icon: bsh,
        iconBg: "#E6DEDD",
        date: "Jan 2021 - Apr 2021",
        points: [
            "Assisted in the maintenance of hospital systems and code testing to ensure functionality.",
            "Developed test plans and scripts to validate new system features.",
            "Collaborated with cross-functional teams to gather and analyze user requirements for system improvements.",
            "Provided technical support to strengthen sales and marketing efforts."
        ],
    },

];


const testimonials = [
    {
        testimonial:
            "I thought it was impossible to make a website as beautiful as our product, but Rick proved me wrong.",
        name: "Sara Lee",
        designation: "CFO",
        company: "Acme Co",
        image: "https://randomuser.me/api/portraits/women/4.jpg",
    },
    {
        testimonial:
            "I've never met a web developer who truly cares about their clients' success like Rick does.",
        name: "Chris Brown",
        designation: "COO",
        company: "DEF Corp",
        image: "https://randomuser.me/api/portraits/men/5.jpg",
    },
    {
        testimonial:
            "After Rick optimized our website, our traffic increased by 50%. We can't thank them enough!",
        name: "Lisa Wang",
        designation: "CTO",
        company: "456 Enterprises",
        image: "https://randomuser.me/api/portraits/women/6.jpg",
    },
];

const projects = [
    {
        name: "Spot Finder",
        description:
            "A parking space time-sharing rental system, addressing urban parking challenges and increasing income for parking space owners.",
        tags: [
            {
                name: "golang",
                color: "blue-text-gradient",
            },
            {
                name: "docker",
                color: "green-text-gradient",
            },
            {
                name: "mysql",
                color: "pink-text-gradient",
            },
        ],
        image: spotFinderLogo, // 使用导入的图片
        source_code_link: "https://longsizhuo.com",
    },
    {
        name: "Hello-algo",
        description:
            "Simplifying data structures and algorithms through visual animations and interactive learning materials.",
        tags: [
            {
                name: "python",
                color: "blue-text-gradient",
            },
            {
                name: "visualization",
                color: "green-text-gradient",
            },
            {
                name: "open-source",
                color: "pink-text-gradient",
            },
        ],
        image: "https://www.hello-algo.com/assets/images/logo.svg", // 使用之前的 logo 路径
        source_code_link: "https://github.com/krahets/hello-algo",
    },
    {
        name: "Dimensionality Reduction Clustering Visualization Tool",
        description:
            "A web-based tool designed to simplify the analysis of single-cell RNA-seq data through intuitive visualization techniques.",
        tags: [
            {
                name: "r",
                color: "blue-text-gradient",
            },
            {
                name: "data-visualization",
                color: "green-text-gradient",
            },
            {
                name: "bioinformatics",
                color: "pink-text-gradient",
            },
        ],
        image: drcvt, // 使用导入的图片
        source_code_link: "https://longsizhuo.shinyapps.io/long/",
    },
];


export { services, technologies, experiences, testimonials, projects };