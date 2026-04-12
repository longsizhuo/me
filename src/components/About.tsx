import { motion } from "motion/react";
import React, { useEffect, useState } from "react";
import { Tilt } from "react-tilt";

import Typography from "@mui/material/Typography";
import { graphql } from "@octokit/graphql";
import { SectionWrapper } from "../hoc";
import { styles } from "../styles";
import { fadeIn, textVariant } from "../utils/motion.ts";
import type { ServiceCardProps } from "./TYPE";

const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN;

const ServiceCard = ({ index, title, icon, description, stars, forks }: ServiceCardProps) => (
  <Tilt
    className="xs:w-[250px] w-full"
    options={{
      max: 45,
      scale: 1,
      speed: 450,
    }}
  >
    <motion.div
      whileInView={{ opacity: 1, y: 0 }} // 当视图中时播放动画
      initial={{ opacity: 0, y: 50 }} // 初始状态
      transition={{ duration: 0.5 }} // 动画时长
      variants={fadeIn("right", "spring", index * 0.5, 0.75)}
      className="w-full green-pink-gradient p-px rounded-[20px] shadow-card"
    >
      <div
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
          style={{ width: "100%" }} // 确保宽度限制，才会截断
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
  const [services, setServices] = useState([]);
  const [ghStats, setGhStats] = useState<{
    followers: number;
    repos: number;
    contributions: number;
  } | null>(null);

  useEffect(() => {
    const fetchPinnedRepos = async () => {
      if (!GITHUB_TOKEN || GITHUB_TOKEN === 'your_github_token_here') return;

      const graphqlWithAuth = graphql.defaults({
        headers: {
          authorization: `token ${GITHUB_TOKEN}`,
        },
      });

      try {
        const { user } = await graphqlWithAuth(`
          {
            user(login: "longsizhuo") {
              followers { totalCount }
              repositories(privacy: PUBLIC) { totalCount }
              contributionsCollection {
                contributionCalendar { totalContributions }
              }
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

        setGhStats({
          followers: user.followers.totalCount,
          repos: user.repositories.totalCount,
          contributions: user.contributionsCollection.contributionCalendar.totalContributions,
        });

        const dynamicServices = user.pinnedItems.nodes.map((repo, index) => ({
          title: repo.name,
          icon: repo.owner.avatarUrl,
          description: repo.description,
          stars: repo.stargazerCount,
          forks: repo.forkCount,
          index,
        }));

        setServices(dynamicServices);
      } catch (error) {
        console.error("Error fetching pinned repos:", error);
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
        className="mt-4 text-secondary text-[17px] max-w-3xl leading-[30px]"
      >
        Below are some of the GitHub repositories I have contributed to,
        including projects that I have pinned on my GitHub profile.
      </motion.p>

      {ghStats && (
        <motion.div
          variants={fadeIn("up", "", 0.3, 0.5)}
          className="mt-8 flex flex-wrap gap-6"
        >
          {[
            { label: "Followers", value: ghStats.followers },
            { label: "Public Repos", value: ghStats.repos },
            { label: "Contributions (Year)", value: ghStats.contributions },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-tertiary px-6 py-4 rounded-xl text-center min-w-[140px]"
            >
              <p className="text-white font-bold text-[28px]">{stat.value}</p>
              <p className="text-secondary text-[14px]">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      )}

      <div className="mt-20 flex flex-wrap gap-10">
        {services.map((service, index) => (
          <ServiceCard key={service.title} index={index} {...service} />
        ))}
      </div>
    </>
  );
};

const AboutWithWrapper = SectionWrapper(About, "about");
export default AboutWithWrapper;
