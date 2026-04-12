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
        company_name: "Kwai",
        icon: kwai,
        iconBg: "#FFF",
        date: "May 2025 - Present",
        points: [
            "Focused on the implementation and optimization of animation infrastructure for internal web projects.",
            "Developed and maintained reusable animation modules using SVG, CSS Keyframes, and Lottie, ensuring consistency and efficiency across teams.",
            "Collaborated with designers and engineers to deliver smooth, subtle, and resource-friendly animation effects.",
            "Paid special attention to animation performance, accessibility, and maintainability, supporting a wide range of browsers and devices."
        ],
    },
    {
        title: "Casual Academic",
        company_name: "University of New South Wales",
        icon: unsw,
        iconBg: "#FFF",
        date: "Sep 2024 - Present",
        points: [
            "Teaching and guiding students in the Principles of Programming and Computer Science Project courses.",
            "Assisting students with programming concepts, debugging, and project management techniques.",
            "Providing clear and constructive feedback on assignments and projects to ensure academic growth.",
            "Collaborating with fellow academics to improve course delivery and student engagement."
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