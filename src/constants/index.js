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
    starbucks,
    tesla,
    shopify,
    carrent,
    jobit,
    tripguide,
    threejs, unsw, spotFinder,
} from "../assets";

export const navLinks = [
    {
        id: "about",
        title: "About",
    },
    {
        id: "work",
        title: "Work",
    },
    {
        id: "contact",
        title: "Contact",
    },
];

let services = [
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
    // {
    //     title: "Core Contributor",
    //     company_name: "Hello-algo",
    //     icon: shopify,
    //     iconBg: "#383E56",
    //     date: "Dec 2022 - Present",
    //     points: [
    //         "Contributed to summarizing and simplifying data structures and algorithms for learners.",
    //         "Managed interactive Q&A segments to engage the community and advance educational value.",
    //         "Translated content into English, making it accessible to a global audience.",
    //         "Helped the project reach 89.3K stars on GitHub and contributed to the sale of 50,000+ books."
    //     ],
    // },
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
        name: "Car Rent",
        description:
            "Web-based platform that allows users to search, book, and manage car rentals from various providers, providing a convenient and efficient solution for transportation needs.",
        tags: [
            {
                name: "react",
                color: "blue-text-gradient",
            },
            {
                name: "mongodb",
                color: "green-text-gradient",
            },
            {
                name: "tailwind",
                color: "pink-text-gradient",
            },
        ],
        image: carrent,
        source_code_link: "https://github.com/",
    },
    {
        name: "Job IT",
        description:
            "Web application that enables users to search for job openings, view estimated salary ranges for positions, and locate available jobs based on their current location.",
        tags: [
            {
                name: "react",
                color: "blue-text-gradient",
            },
            {
                name: "restapi",
                color: "green-text-gradient",
            },
            {
                name: "scss",
                color: "pink-text-gradient",
            },
        ],
        image: jobit,
        source_code_link: "https://github.com/",
    },
    {
        name: "Trip Guide",
        description:
            "A comprehensive travel booking platform that allows users to book flights, hotels, and rental cars, and offers curated recommendations for popular destinations.",
        tags: [
            {
                name: "nextjs",
                color: "blue-text-gradient",
            },
            {
                name: "supabase",
                color: "green-text-gradient",
            },
            {
                name: "css",
                color: "pink-text-gradient",
            },
        ],
        image: tripguide,
        source_code_link: "https://github.com/",
    },
];

export { services, technologies, experiences, testimonials, projects };