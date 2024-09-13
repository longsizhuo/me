import React, {useEffect, useState} from "react";
import { Tilt }from "react-tilt";
import { motion } from "framer-motion";

import { styles } from "../styles";
import { SectionWrapper } from "../hoc";
import { fadeIn, textVariant } from "../utils/motion";
import {graphql} from "@octokit/graphql";
import Typography from "@mui/material/Typography";


const GITHUB_TOKEN = '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';

const ServiceCard = ({ index, title, icon, description, stars, forks }) => (
    <Tilt className="xs:w-[250px] w-full">
        <motion.div
            whileInView={{ opacity: 1, y: 0 }} // 当视图中时播放动画
            initial={{ opacity: 0, y: 50 }}    // 初始状态
            transition={{ duration: 0.5 }}     // 动画时长
            variants={fadeIn("right", "spring", index * 0.5, 0.75)}
            className="w-full green-pink-gradient p-[1px] rounded-[20px] shadow-card"
        >
            <div
                options={{
                    max: 45,
                    scale: 1,
                    speed: 450,
                }}
                className="bg-tertiary rounded-[20px] py-5 px-12 min-h-[320px] flex justify-evenly items-center flex-col"
            >
                <img
                    src={icon}
                    alt={title}
                    className="w-20 h-20 object-contain" // 调整图片大小
                />


                <Typography
                    variant="h6"
                    component="h3"
                    className="text-white font-bold text-center"
                    noWrap
                    style={{width: "100%"}} // 确保宽度限制，才会截断
                >
                    {title}
                </Typography>
                <p className="text-white text-[14px] text-center">{description}</p>
                <p className="text-white text-[14px] text-center">
                    ⭐ Stars: {stars} | 🍴 Forks: {forks}
                </p>
            </div>
        </motion.div>
    </Tilt>
);

const About = () => {
    const [services, setServices] = useState([]); // State to hold dynamic GitHub data

    useEffect(() => {
        const fetchPinnedRepos = async () => {
            const graphqlWithAuth = graphql.defaults({
                headers: {
                    authorization: `token ${GITHUB_TOKEN}`,
                },
            });

            try {
                const {user} = await graphqlWithAuth(`
          {
            user(login: "longsizhuo") {
              pinnedItems(first: 4, types: REPOSITORY) {
                nodes {
                  ... on Repository {
                    id
                    name
                    description
                    stargazerCount
                    forkCount
                    owner {
                      login
                      avatarUrl
                    }
                  }
                }
              }
            }
          }
        `);

                const dynamicServices = user.pinnedItems.nodes.map((repo, index) => ({
                    title: repo.name,
                    icon: repo.owner.avatarUrl,
                    description: repo.description,
                    stars: repo.stargazerCount,
                    forks: repo.forkCount,
                    index,
                }));

                setServices(dynamicServices); // Update services with GitHub data

            } catch (error) {
                console.error('Error fetching pinned repos:', error);
            }
        };

        fetchPinnedRepos();
    }, []);
    return (
        <>
            <motion.div variants={textVariant()}>
                <p className={styles.sectionSubText}>Introduction</p>
                <h2 className={styles.sectionHeadText}>Contribute.</h2>
            </motion.div>

            <motion.p
                variants={fadeIn("", "", 0.1, 1)}
                className='mt-4 text-secondary text-[17px] max-w-3xl leading-[30px]'
            >
                Below are some of the GitHub repositories I have contributed to, including projects that I have pinned on my GitHub profile.

            </motion.p>

            <div className='mt-20 flex flex-wrap gap-10'>
                {services.map((service, index) => (
                    <ServiceCard key={service.title} index={index} {...service} />
                ))}
            </div>
        </>
    );
};

export default SectionWrapper(About, "about");
