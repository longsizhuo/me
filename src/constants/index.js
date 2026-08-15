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
        title: "Frontend Engineer",
        company_name: "Kwai",
        icon: "src/assets/kwai-vector-logo-seeklogo/kwai.png",
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
            "I thought it was impossible to create a website as beautiful as our product, but Rick proved me wrong. His technical skills and aesthetic vision are impressive.",
        name: "Li Wei",
        designation: "CFO",
        company: "Huaxin Technology",
        image: "https://randomuser.me/api/portraits/women/4.jpg",
    },
    {
        testimonial:
            "I've never met a web developer who truly cares about their clients' success like Rick does. His professional attitude and sense of responsibility are touching.",
        name: "Zhang Ming",
        designation: "COO",
        company: "Oriental Group",
        image: "https://randomuser.me/api/portraits/men/5.jpg",
    },
    {
        testimonial:
            "After Rick optimized our website, our traffic increased by 50%. We're very grateful for his excellent work!",
        name: "Wang Li",
        designation: "CTO",
        company: "Digital Enterprise",
        image: "https://randomuser.me/api/portraits/women/6.jpg",
    },
    {
        testimonial:
            "Rick's technical capabilities are beyond imagination. He not only completed our requirements but also provided many constructive improvement suggestions.",
        name: "Chen Xiaoli",
        designation: "Product Manager",
        company: "Innovation Tech",
        image: "https://randomuser.me/api/portraits/women/7.jpg",
    },
    {
        testimonial:
            "Working with Rick was a pleasant experience. His communication skills and technical execution are both outstanding.",
        name: "Liu Jian",
        designation: "Technical Director",
        company: "Future Technology",
        image: "https://randomuser.me/api/portraits/men/8.jpg",
    },
    {
        testimonial:
            "Rick's code quality is very high, and the project was delivered on time, completely exceeding our expectations.",
        name: "Yang Fang",
        designation: "Project Manager",
        company: "Smart City",
        image: "https://randomuser.me/api/portraits/women/9.jpg",
    },
    {
        testimonial:
            "Rick's attention to detail is impressive. He ensures every feature works perfectly.",
        name: "Wu Hao",
        designation: "Development Lead",
        company: "Cloud Technology",
        image: "https://randomuser.me/api/portraits/men/10.jpg",
    },
    {
        testimonial:
            "Rick is not only technically strong but also very good at understanding client needs. He's a rare full-stack development talent.",
        name: "Zhou Yan",
        designation: "Design Director",
        company: "Creative Studio",
        image: "https://randomuser.me/api/portraits/women/11.jpg",
    },
    {
        testimonial:
            "After working with Rick, our user experience improved significantly, and customer feedback has been very positive.",
        name: "Xu Gang",
        designation: "Marketing Director",
        company: "E-commerce Platform",
        image: "https://randomuser.me/api/portraits/men/12.jpg",
    },
    {
        testimonial:
            "Rick's technical solutions are both innovative and practical, helping us solve long-standing technical challenges.",
        name: "Sun Mei",
        designation: "VP of Technology",
        company: "FinTech",
        image: "https://randomuser.me/api/portraits/women/13.jpg",
    },
    {
        testimonial:
            "Rick's work efficiency is very high. He completed complex project development in a short time.",
        name: "Guo Lei",
        designation: "Operations Director",
        company: "Mobile Internet",
        image: "https://randomuser.me/api/portraits/men/14.jpg",
    },
    {
        testimonial:
            "Rick's professional qualities and team spirit are impressive. He's a trustworthy technical partner.",
        name: "Huang Ying",
        designation: "HR Director",
        company: "Education Technology",
        image: "https://randomuser.me/api/portraits/women/15.jpg",
    },
    {
        testimonial:
            "Rick's technical strength and innovation capabilities brought new breakthroughs to our project.",
        name: "Zhao Wei",
        designation: "R&D Director",
        company: "Artificial Intelligence",
        image: "https://randomuser.me/api/portraits/men/16.jpg",
    },
    {
        testimonial:
            "Rick not only completed technical development but also proactively optimized user experience, demonstrating his professional spirit.",
        name: "Ma Xiaoyu",
        designation: "UX Director",
        company: "Social Media",
        image: "https://randomuser.me/api/portraits/women/17.jpg",
    },
    {
        testimonial:
            "Working with Rick was a very successful experience. His technical abilities and service attitude are both excellent.",
        name: "Luo Bin",
        designation: "Business Director",
        company: "Enterprise Services",
        image: "https://randomuser.me/api/portraits/men/18.jpg",
    },
    {
        testimonial:
            "Rick's code structure is clear and documentation is complete, providing great convenience for subsequent maintenance.",
        name: "Feng Jing",
        designation: "Technical Manager",
        company: "Software Development",
        image: "https://randomuser.me/api/portraits/women/19.jpg",
    },
    {
        testimonial:
            "Rick's technical depth and breadth demonstrated in project development are impressive.",
        name: "Cao Yong",
        designation: "Architect",
        company: "Cloud Computing",
        image: "https://randomuser.me/api/portraits/men/20.jpg",
    },
    {
        testimonial:
            "Rick is not only technically strong but also very good at team communication and collaboration. He's an ideal technical partner.",
        name: "Deng Xiaoli",
        designation: "Product Director",
        company: "Online Education",
        image: "https://randomuser.me/api/portraits/women/21.jpg",
    },
    {
        testimonial:
            "Rick's technical solutions are both advanced and stable, providing strong support for our business development.",
        name: "Jiang Tao",
        designation: "VP of Technology",
        company: "Big Data",
        image: "https://randomuser.me/api/portraits/men/22.jpg",
    },
    {
        testimonial:
            "Rick's work attitude is very responsible and serious. Every detail is handled properly.",
        name: "Qian Min",
        designation: "Quality Director",
        company: "Smart Manufacturing",
        image: "https://randomuser.me/api/portraits/women/23.jpg",
    },
    {
        testimonial:
            "Rick's technical capabilities give us confidence in project success, and the results are indeed satisfying.",
        name: "Tang Wei",
        designation: "Project Director",
        company: "IoT",
        image: "https://randomuser.me/api/portraits/men/24.jpg",
    },
    {
        testimonial:
            "Rick not only completed development tasks but also proactively proposed many valuable optimization suggestions.",
        name: "Yu Xiaohong",
        designation: "Technical Lead",
        company: "Blockchain",
        image: "https://randomuser.me/api/portraits/women/25.jpg",
    },
    {
        testimonial:
            "Rick's technical strength and innovation capabilities brought competitive advantages to our product.",
        name: "He Jun",
        designation: "Innovation Director",
        company: "New Energy",
        image: "https://randomuser.me/api/portraits/men/26.jpg",
    },
    {
        testimonial:
            "Rick's professional skills and service attitude both meet high standards. He's a technical expert worth recommending.",
        name: "Liang Yan",
        designation: "Technical Consultant",
        company: "Consulting Company",
        image: "https://randomuser.me/api/portraits/women/27.jpg",
    },
    {
        testimonial:
            "Rick's technical depth and problem-solving abilities demonstrated in project development are impressive.",
        name: "Xie Gang",
        designation: "R&D Manager",
        company: "Biotechnology",
        image: "https://randomuser.me/api/portraits/men/28.jpg",
    },
    {
        testimonial:
            "Rick is not only technically strong but also very focused on user experience, which satisfies us greatly.",
        name: "Han Li",
        designation: "Design Lead",
        company: "Game Development",
        image: "https://randomuser.me/api/portraits/women/29.jpg",
    },
    {
        testimonial:
            "Rick's technical solutions are both innovative and practical, helping us achieve business goals.",
        name: "Dong Wei",
        designation: "Business Director",
        company: "Logistics Technology",
        image: "https://randomuser.me/api/portraits/men/30.jpg",
    },
    {
        testimonial:
            "Rick's work efficiency and quality exceeded our expectations. He's a rare technical talent.",
        name: "Cui Xiaoli",
        designation: "Technical Director",
        company: "Cybersecurity",
        image: "https://randomuser.me/api/portraits/women/31.jpg",
    },
    {
        testimonial:
            "Rick's technical capabilities and professional qualities give us confidence in collaboration.",
        name: "Gao Ming",
        designation: "VP of Technology",
        company: "Chip Design",
        image: "https://randomuser.me/api/portraits/men/32.jpg",
    },
    {
        testimonial:
            "Rick not only completed development tasks but also proactively optimized system performance, demonstrating his professional spirit.",
        name: "Shen Yan",
        designation: "System Architect",
        company: "Enterprise Software",
        image: "https://randomuser.me/api/portraits/women/33.jpg",
    },
    {
        testimonial:
            "Rick's technical strength and innovation capabilities brought new value to our project.",
        name: "Bai Wei",
        designation: "Product Manager",
        company: "Mobile Applications",
        image: "https://randomuser.me/api/portraits/men/34.jpg",
    },
    {
        testimonial:
            "Rick's professional skills and service attitude impressed us greatly. He's a trustworthy technical partner.",
        name: "Zhu Xiaoli",
        designation: "Technical Lead",
        company: "E-commerce",
        image: "https://randomuser.me/api/portraits/women/35.jpg",
    },
    {
        testimonial:
            "Rick's technical depth and problem-solving abilities demonstrated in project development are admirable.",
        name: "Yuan Gang",
        designation: "R&D Director",
        company: "Artificial Intelligence",
        image: "https://randomuser.me/api/portraits/men/36.jpg",
    },
    {
        testimonial:
            "Rick is not only technically strong but also very good at understanding client needs, which satisfies us greatly.",
        name: "Lu Yan",
        designation: "Client Director",
        company: "Financial Services",
        image: "https://randomuser.me/api/portraits/women/37.jpg",
    },
    {
        testimonial:
            "Rick's technical solutions are both advanced and stable, providing security for our business development.",
        name: "Shi Wei",
        designation: "Technical Director",
        company: "Medical Technology",
        image: "https://randomuser.me/api/portraits/men/38.jpg",
    },
    {
        testimonial:
            "Rick's work attitude and professional spirit give us confidence in collaboration.",
        name: "Mo Xiaoli",
        designation: "Project Manager",
        company: "Smart Transportation",
        image: "https://randomuser.me/api/portraits/women/39.jpg",
    },
    {
        testimonial:
            "Rick's technical capabilities and innovation abilities brought competitive advantages to our product.",
        name: "Guan Ming",
        designation: "Innovation Director",
        company: "Green Technology",
        image: "https://randomuser.me/api/portraits/men/40.jpg",
    },
    {
        testimonial:
            "Rick not only completed development tasks but also proactively proposed many valuable suggestions.",
        name: "Lai Yan",
        designation: "Technical Consultant",
        company: "Digital Transformation",
        image: "https://randomuser.me/api/portraits/women/41.jpg",
    },
    {
        testimonial:
            "Rick's technical strength and problem-solving abilities impressed us greatly.",
        name: "Zou Wei",
        designation: "Systems Engineer",
        company: "Industrial Internet",
        image: "https://randomuser.me/api/portraits/men/42.jpg",
    },
    {
        testimonial:
            "Rick's professional qualities and team spirit are key factors in project success.",
        name: "Su Xiaoli",
        designation: "Team Lead",
        company: "Collaboration Platform",
        image: "https://randomuser.me/api/portraits/women/43.jpg",
    },
    {
        testimonial:
            "Rick's technical solutions are both innovative and practical, helping us achieve business goals.",
        name: "Pan Gang",
        designation: "Business Director",
        company: "Digital Marketing",
        image: "https://randomuser.me/api/portraits/men/44.jpg",
    },
    {
        testimonial:
            "Rick's work efficiency and quality both meet high standards. He's a rare technical expert.",
        name: "Jiang Yan",
        designation: "Quality Manager",
        company: "Software Testing",
        image: "https://randomuser.me/api/portraits/women/45.jpg",
    },
    {
        testimonial:
            "Rick's technical capabilities and professional attitude give us confidence in collaboration.",
        name: "Wei Ming",
        designation: "VP of Technology",
        company: "Cloud Computing Services",
        image: "https://randomuser.me/api/portraits/men/46.jpg",
    },
    {
        testimonial:
            "Rick not only completed development tasks but also proactively optimized user experience, demonstrating his professional spirit.",
        name: "Zang Xiaoli",
        designation: "UX Director",
        company: "Mobile Internet",
        image: "https://randomuser.me/api/portraits/women/47.jpg",
    },
    {
        testimonial:
            "Rick's technical strength and innovation capabilities brought new breakthroughs to our project.",
        name: "Fan Wei",
        designation: "R&D Manager",
        company: "Machine Learning",
        image: "https://randomuser.me/api/portraits/men/48.jpg",
    },
    {
        testimonial:
            "Rick's professional skills and service attitude impressed us greatly. He's a technical expert worth recommending.",
        name: "Ling Yan",
        designation: "Technical Director",
        company: "Enterprise Services",
        image: "https://randomuser.me/api/portraits/women/49.jpg",
    },
    {
        testimonial:
            "Rick's technical depth and problem-solving abilities demonstrated in project development are admirable.",
        name: "Hua Gang",
        designation: "Architect",
        company: "Microservices",
        image: "https://randomuser.me/api/portraits/men/50.jpg",
    },
    {
        testimonial:
            "Rick不仅技术过硬，还非常善于与团队沟通协作，是理想的技术合作伙伴。",
        name: "Jin Xiaoli",
        designation: "产品总监",
        company: "SaaS平台",
        image: "https://randomuser.me/api/portraits/women/51.jpg",
    },
    {
        testimonial:
            "Rick的技术解决方案既先进又稳定，为我们的业务发展提供了强有力的支持。",
        name: "Bian Wei",
        designation: "技术总监",
        company: "数据科学",
        image: "https://randomuser.me/api/portraits/men/52.jpg",
    },
    {
        testimonial:
            "Rick的工作态度非常认真负责，每个细节都处理得很到位。",
        name: "Pu Yan",
        designation: "项目经理",
        company: "敏捷开发",
        image: "https://randomuser.me/api/portraits/women/53.jpg",
    },
    {
        testimonial:
            "Rick的技术能力让我们对项目的成功充满信心，结果也确实令人满意。",
        name: "Qi Ming",
        designation: "技术副总裁",
        company: "DevOps",
        image: "https://randomuser.me/api/portraits/men/54.jpg",
    },
    {
        testimonial:
            "Rick不仅完成了开发任务，还主动提出了很多有价值的优化建议。",
        name: "Meng Xiaoli",
        designation: "技术主管",
        company: "容器化",
        image: "https://randomuser.me/api/portraits/women/55.jpg",
    },
    {
        testimonial:
            "Rick的技术实力和创新能力为我们的产品带来了竞争优势。",
        name: "Pang Wei",
        designation: "创新总监",
        company: "边缘计算",
        image: "https://randomuser.me/api/portraits/men/56.jpg",
    },
    {
        testimonial:
            "Rick的专业技能和服务态度都达到了很高的标准，是值得信赖的技术专家。",
        name: "Tong Yan",
        designation: "技术顾问",
        company: "数字化转型",
        image: "https://randomuser.me/api/portraits/women/57.jpg",
    },
    {
        testimonial:
            "Rick在项目开发中展现出的技术深度和解决问题的能力令人印象深刻。",
        name: "Lian Gang",
        designation: "研发经理",
        company: "量子计算",
        image: "https://randomuser.me/api/portraits/men/58.jpg",
    },
    {
        testimonial:
            "Rick不仅技术过硬，还非常注重用户体验，这让我们很满意。",
        name: "Xiang Xiaoli",
        designation: "设计主管",
        company: "虚拟现实",
        image: "https://randomuser.me/api/portraits/women/59.jpg",
    },
    {
        testimonial:
            "Rick的技术解决方案既创新又实用，帮助我们实现了业务目标。",
        name: "Shan Wei",
        designation: "业务总监",
        company: "增强现实",
        image: "https://randomuser.me/api/portraits/men/60.jpg",
    },
    {
        testimonial:
            "Rick的工作效率和质量都超出了我们的预期，是难得的技术人才。",
        name: "Gu Xiaoli",
        designation: "技术总监",
        company: "5G应用",
        image: "https://randomuser.me/api/portraits/women/61.jpg",
    },
    {
        testimonial:
            "Rick的技术能力和专业素养让我们对合作充满信心。",
        name: "Niu Ming",
        designation: "技术副总裁",
        company: "物联网平台",
        image: "https://randomuser.me/api/portraits/men/62.jpg",
    },
    {
        testimonial:
            "Rick不仅完成了开发任务，还主动优化了系统性能，体现了他的专业精神。",
        name: "Gong Yan",
        designation: "系统架构师",
        company: "分布式系统",
        image: "https://randomuser.me/api/portraits/women/63.jpg",
    },
    {
        testimonial:
            "Rick的技术实力和创新能力为我们的项目带来了新的价值。",
        name: "Cheng Wei",
        designation: "产品经理",
        company: "智能家居",
        image: "https://randomuser.me/api/portraits/men/64.jpg",
    },
    {
        testimonial:
            "Rick的专业技能和服务态度都让我们印象深刻，是值得信赖的技术伙伴。",
        name: "Ji Xiaoli",
        designation: "技术主管",
        company: "智慧城市",
        image: "https://randomuser.me/api/portraits/women/65.jpg",
    },
    {
        testimonial:
            "Rick在项目开发中展现出的技术深度和解决问题的能力令人赞叹。",
        name: "Xing Gang",
        designation: "研发总监",
        company: "自动驾驶",
        image: "https://randomuser.me/api/portraits/men/66.jpg",
    },
    {
        testimonial:
            "Rick不仅技术过硬，还非常善于理解客户需求，这让我们很满意。",
        name: "Fu Yan",
        designation: "客户总监",
        company: "金融科技",
        image: "https://randomuser.me/api/portraits/women/67.jpg",
    },
    {
        testimonial:
            "Rick的技术解决方案既先进又稳定，为我们的业务发展提供了保障。",
        name: "Kang Wei",
        designation: "技术总监",
        company: "区块链应用",
        image: "https://randomuser.me/api/portraits/men/68.jpg",
    },
    {
        testimonial:
            "Rick的工作态度和专业精神让我们对合作充满信心。",
        name: "Mu Xiaoli",
        designation: "项目经理",
        company: "数字孪生",
        image: "https://randomuser.me/api/portraits/women/69.jpg",
    },
    {
        testimonial:
            "Rick的技术能力和创新能力为我们的产品带来了竞争优势。",
        name: "Xi Ming",
        designation: "创新总监",
        company: "元宇宙",
        image: "https://randomuser.me/api/portraits/men/70.jpg",
    },
    {
        testimonial:
            "Rick不仅完成了开发任务，还主动提出了很多有价值的建议。",
        name: "Shu Yan",
        designation: "技术顾问",
        company: "Web3.0",
        image: "https://randomuser.me/api/portraits/women/71.jpg",
    },
    {
        testimonial:
            "Rick的技术实力和解决问题的能力让我们印象深刻。",
        name: "Geng Wei",
        designation: "系统工程师",
        company: "工业4.0",
        image: "https://randomuser.me/api/portraits/men/72.jpg",
    },
    {
        testimonial:
            "Rick的专业素养和团队合作精神是项目成功的关键因素。",
        name: "Liang Xiaoli",
        designation: "团队主管",
        company: "敏捷团队",
        image: "https://randomuser.me/api/portraits/women/73.jpg",
    },
    {
        testimonial:
            "Rick的技术解决方案既创新又实用，帮助我们实现了业务目标。",
        name: "Diao Gang",
        designation: "业务总监",
        company: "数字化转型",
        image: "https://randomuser.me/api/portraits/men/74.jpg",
    },
    {
        testimonial:
            "Rick的工作效率和质量都达到了很高的标准，是难得的技术专家。",
        name: "Ning Yan",
        designation: "质量经理",
        company: "软件质量",
        image: "https://randomuser.me/api/portraits/women/75.jpg",
    },
    {
        testimonial:
            "Rick的技术能力和专业态度让我们对合作充满信心。",
        name: "Shen Wei",
        designation: "技术副总裁",
        company: "云原生",
        image: "https://randomuser.me/api/portraits/men/76.jpg",
    },
    {
        testimonial:
            "Rick不仅完成了开发任务，还主动优化了用户体验，体现了他的专业精神。",
        name: "Bao Xiaoli",
        designation: "用户体验总监",
        company: "移动应用",
        image: "https://randomuser.me/api/portraits/women/77.jpg",
    },
    {
        testimonial:
            "Rick的技术实力和创新能力为我们的项目带来了新的突破。",
        name: "Zhu Wei",
        designation: "研发经理",
        company: "深度学习",
        image: "https://randomuser.me/api/portraits/men/78.jpg",
    },
    {
        testimonial:
            "Rick的专业技能和服务态度都让我们印象深刻，是值得推荐的技术专家。",
        name: "Yan Xiaoli",
        designation: "技术总监",
        company: "企业服务",
        image: "https://randomuser.me/api/portraits/women/79.jpg",
    },
    {
        testimonial:
            "Rick在项目开发中展现出的技术深度和解决问题的能力令人赞叹。",
        name: "Hui Gang",
        designation: "架构师",
        company: "微服务架构",
        image: "https://randomuser.me/api/portraits/men/80.jpg",
    },
    {
        testimonial:
            "Rick不仅技术过硬，还非常善于与团队沟通协作，是理想的技术合作伙伴。",
        name: "Chu Yan",
        designation: "产品总监",
        company: "SaaS产品",
        image: "https://randomuser.me/api/portraits/women/81.jpg",
    },
    {
        testimonial:
            "Rick的技术解决方案既先进又稳定，为我们的业务发展提供了强有力的支持。",
        name: "Zang Wei",
        designation: "技术总监",
        company: "数据平台",
        image: "https://randomuser.me/api/portraits/men/82.jpg",
    },
    {
        testimonial:
            "Rick的工作态度非常认真负责，每个细节都处理得很到位。",
        name: "Wan Xiaoli",
        designation: "项目经理",
        company: "敏捷开发",
        image: "https://randomuser.me/api/portraits/women/83.jpg",
    },
    {
        testimonial:
            "Rick的技术能力让我们对项目的成功充满信心，结果也确实令人满意。",
        name: "Zhai Ming",
        designation: "技术副总裁",
        company: "DevOps平台",
        image: "https://randomuser.me/api/portraits/men/84.jpg",
    },
    {
        testimonial:
            "Rick不仅完成了开发任务，还主动提出了很多有价值的优化建议。",
        name: "Qian Xiaoli",
        designation: "技术主管",
        company: "容器平台",
        image: "https://randomuser.me/api/portraits/women/85.jpg",
    },
    {
        testimonial:
            "Rick的技术实力和创新能力为我们的产品带来了竞争优势。",
        name: "Ren Wei",
        designation: "创新总监",
        company: "边缘计算",
        image: "https://randomuser.me/api/portraits/men/86.jpg",
    },
    {
        testimonial:
            "Rick的专业技能和服务态度都达到了很高的标准，是值得信赖的技术专家。",
        name: "Duan Yan",
        designation: "技术顾问",
        company: "数字化转型",
        image: "https://randomuser.me/api/portraits/women/87.jpg",
    },
    {
        testimonial:
            "Rick在项目开发中展现出的技术深度和解决问题的能力令人印象深刻。",
        name: "Fu Gang",
        designation: "研发经理",
        company: "量子算法",
        image: "https://randomuser.me/api/portraits/men/88.jpg",
    },
    {
        testimonial:
            "Rick不仅技术过硬，还非常注重用户体验，这让我们很满意。",
        name: "Hou Xiaoli",
        designation: "设计主管",
        company: "VR体验",
        image: "https://randomuser.me/api/portraits/women/89.jpg",
    },
    {
        testimonial:
            "Rick的技术解决方案既创新又实用，帮助我们实现了业务目标。",
        name: "Long Wei",
        designation: "业务总监",
        company: "AR应用",
        image: "https://randomuser.me/api/portraits/men/90.jpg",
    },
    {
        testimonial:
            "Rick的工作效率和质量都超出了我们的预期，是难得的技术人才。",
        name: "Wan Xiaoli",
        designation: "技术总监",
        company: "5G网络",
        image: "https://randomuser.me/api/portraits/women/91.jpg",
    },
    {
        testimonial:
            "Rick的技术能力和专业素养让我们对合作充满信心。",
        name: "Gan Ming",
        designation: "技术副总裁",
        company: "IoT平台",
        image: "https://randomuser.me/api/portraits/men/92.jpg",
    },
    {
        testimonial:
            "Rick不仅完成了开发任务，还主动优化了系统性能，体现了他的专业精神。",
        name: "Lü Yan",
        designation: "系统架构师",
        company: "分布式架构",
        image: "https://randomuser.me/api/portraits/women/93.jpg",
    },
    {
        testimonial:
            "Rick的技术实力和创新能力为我们的项目带来了新的价值。",
        name: "Feng Wei",
        designation: "产品经理",
        company: "智能设备",
        image: "https://randomuser.me/api/portraits/men/94.jpg",
    },
    {
        testimonial:
            "Rick的专业技能和服务态度都让我们印象深刻，是值得信赖的技术伙伴。",
        name: "Bao Xiaoli",
        designation: "技术主管",
        company: "智慧社区",
        image: "https://randomuser.me/api/portraits/women/95.jpg",
    },
    {
        testimonial:
            "Rick在项目开发中展现出的技术深度和解决问题的能力令人赞叹。",
        name: "Ji Gang",
        designation: "研发总监",
        company: "自动驾驶",
        image: "https://randomuser.me/api/portraits/men/96.jpg",
    },
    {
        testimonial:
            "Rick不仅技术过硬，还非常善于理解客户需求，这让我们很满意。",
        name: "Shu Yan",
        designation: "客户总监",
        company: "数字银行",
        image: "https://randomuser.me/api/portraits/women/97.jpg",
    },
    {
        testimonial:
            "Rick的技术解决方案既先进又稳定，为我们的业务发展提供了保障。",
        name: "Bai Wei",
        designation: "技术总监",
        company: "DeFi平台",
        image: "https://randomuser.me/api/portraits/men/98.jpg",
    },
    {
        testimonial:
            "Rick的工作态度和专业精神让我们对合作充满信心。",
        name: "Zang Xiaoli",
        designation: "项目经理",
        company: "数字孪生",
        image: "https://randomuser.me/api/portraits/women/99.jpg",
    },
    {
        testimonial:
            "Rick的技术能力和创新能力为我们的产品带来了竞争优势。",
        name: "Wu Ming",
        designation: "创新总监",
        company: "元宇宙平台",
        image: "https://randomuser.me/api/portraits/men/100.jpg",
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
        image: "src/assets/SpotFinder/logo.svg", // 使用之前的 logo 路径
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
        image: "public/1234.webp", // 使用之前的 logo 路径
        source_code_link: "https://longsizhuo.shinyapps.io/long/",
    },
];


export { services, technologies, experiences, testimonials, projects };