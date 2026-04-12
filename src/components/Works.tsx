import { motion } from "motion/react";
import React, { useEffect, useState } from "react";
import { Tilt } from "react-tilt";
import { graphql } from "@octokit/graphql";

import { SectionWrapper } from "../hoc";
import { styles } from "../styles";
import { fadeIn, textVariant } from "../utils/motion.ts";
import ProjectOverlay from "./ProjectOverlay.tsx";

const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN;

interface PinnedRepo {
  id: string;
  name: string;
  description: string;
  url: string;
  homepageUrl: string | null;
  stargazerCount: number;
  forkCount: number;
  openGraphImageUrl: string;
  owner: {
    login: string;
    avatarUrl: string;
  };
  languages: {
    nodes: { name: string; color: string }[];
  };
}

const langColorMap: Record<string, string> = {
  TypeScript: "blue-text-gradient",
  JavaScript: "green-text-gradient",
  Python: "pink-text-gradient",
  Go: "blue-text-gradient",
  Rust: "pink-text-gradient",
  Java: "green-text-gradient",
  R: "blue-text-gradient",
  C: "pink-text-gradient",
  "C++": "blue-text-gradient",
  HTML: "green-text-gradient",
  CSS: "pink-text-gradient",
};

const ProjectCard = ({
  index,
  repo,
  onClick,
}: {
  index: number;
  repo: PinnedRepo;
  onClick: () => void;
}) => {
  const tags = repo.languages.nodes.slice(0, 3).map((lang) => ({
    name: lang.name,
    color: langColorMap[lang.name] || "blue-text-gradient",
  }));

  return (
    <motion.div onClick={onClick} variants={fadeIn("up", "", index * 0.5, 0.75)}>
      <Tilt
        options={{ max: 45, scale: 0.9, speed: 450 }}
        className="bg-tertiary p-5 rounded-2xl sm:w-[360px] w-full cursor-pointer"
      >
        <div className="relative w-full h-[230px]">
          <img
            src={repo.openGraphImageUrl}
            alt={repo.name}
            className="w-full h-full object-cover rounded-2xl"
          />
        </div>

        <div className="mt-5">
          <h3 className="text-white font-bold text-[24px]">{repo.name}</h3>
          <p className="mt-2 text-secondary text-[14px] line-clamp-3">
            {repo.description || "No description provided."}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 items-center">
          {tags.map((tag) => (
            <p key={tag.name} className={`text-[14px] ${tag.color}`}>
              #{tag.name}
            </p>
          ))}
          <span className="text-secondary text-[13px] ml-auto">
            {repo.stargazerCount} | {repo.forkCount}
          </span>
        </div>
      </Tilt>
    </motion.div>
  );
};

const Works = () => {
  const [repos, setRepos] = useState<PinnedRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<PinnedRepo | null>(null);

  useEffect(() => {
    const fetchPinnedRepos = async () => {
      if (!GITHUB_TOKEN || GITHUB_TOKEN === "your_github_token_here") return;

      const graphqlWithAuth = graphql.defaults({
        headers: { authorization: `token ${GITHUB_TOKEN}` },
      });

      try {
        const { user } = await graphqlWithAuth<{ user: { pinnedItems: { nodes: PinnedRepo[] } } }>(`
          {
            user(login: "longsizhuo") {
              pinnedItems(first: 6, types: REPOSITORY) {
                nodes {
                  ... on Repository {
                    id
                    name
                    description
                    url
                    homepageUrl
                    stargazerCount
                    forkCount
                    openGraphImageUrl
                    owner {
                      login
                      avatarUrl
                    }
                    languages(first: 3, orderBy: { field: SIZE, direction: DESC }) {
                      nodes {
                        name
                        color
                      }
                    }
                  }
                }
              }
            }
          }
        `);

        setRepos(user.pinnedItems.nodes);
      } catch (error) {
        console.error("Error fetching pinned repos:", error);
      }
    };

    fetchPinnedRepos();
  }, []);

  return (
    <>
      <motion.div variants={textVariant()}>
        <p className={`${styles.sectionSubText}`}>My work</p>
        <h2 className={`${styles.sectionHeadText}`}>Projects.</h2>
      </motion.div>

      <div className="w-full flex">
        <motion.p
          variants={fadeIn("", "", 0.1, 1)}
          className="mt-3 text-secondary text-[17px] max-w-3xl leading-[30px]"
        >
          These are the repositories I've pinned on my GitHub profile — projects
          I'm most proud of or actively contributing to. Click any card to see
          more details and a live preview.
        </motion.p>
      </div>

      <div className="mt-20 flex flex-wrap gap-7">
        {repos.map((repo, index) => (
          <ProjectCard
            key={repo.id}
            index={index}
            repo={repo}
            onClick={() => setSelectedRepo(repo)}
          />
        ))}
      </div>

      {selectedRepo && (
        <ProjectOverlay
          open
          onClose={() => setSelectedRepo(null)}
          onBack={() => setSelectedRepo(null)}
          title={selectedRepo.name}
          description={selectedRepo.description}
          githubUrl={selectedRepo.url}
          liveUrl={selectedRepo.homepageUrl || undefined}
        />
      )}
    </>
  );
};

const WorksWithWrapper = SectionWrapper(Works, "projects");
export default WorksWithWrapper;
