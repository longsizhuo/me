import { motion } from "motion/react";
import React, { useEffect, useState } from "react";
import { Tilt } from "react-tilt";
import { graphql } from "@octokit/graphql";

import { projects } from "../constants";
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
  "C++": "blue-text-gradient",
  HTML: "green-text-gradient",
  CSS: "pink-text-gradient",
};

// Card for hardcoded projects (e.g. closed-source graduation projects)
const StaticProjectCard = ({
  index,
  name,
  description,
  tags,
  image,
  onClick,
}: {
  index: number;
  name: string;
  description: string;
  tags: { name: string; color: string }[];
  image: string;
  onClick: () => void;
}) => (
  <motion.div onClick={onClick} variants={fadeIn("up", "", index * 0.5, 0.75)}>
    <Tilt
      options={{ max: 45, scale: 0.9, speed: 450 }}
      className="bg-tertiary p-5 rounded-2xl sm:w-[360px] w-full cursor-pointer"
    >
      <div className="relative w-full h-[230px]">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover rounded-2xl"
        />
      </div>
      <div className="mt-5">
        <h3 className="text-white font-bold text-[24px]">{name}</h3>
        <p className="mt-2 text-secondary text-[14px] line-clamp-3">{description}</p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <p key={tag.name} className={`text-[14px] ${tag.color}`}>
            #{tag.name}
          </p>
        ))}
      </div>
    </Tilt>
  </motion.div>
);

// Card for GitHub pinned repos
const GitHubProjectCard = ({
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
  const [selectedOverlay, setSelectedOverlay] = useState<{
    title: string;
    description: string;
    githubUrl?: string;
    liveUrl?: string;
    photos?: string[];
  } | null>(null);

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
          A mix of personal projects, open-source contributions, and academic work.
          Click any card to see more details and a live preview.
        </motion.p>
      </div>

      {/* Hardcoded projects (closed-source, graduation projects, etc.) */}
      <div className="mt-10 flex flex-wrap gap-7">
        {projects.map((project, index) => (
          <StaticProjectCard
            key={`static-${index}`}
            index={index}
            name={project.name}
            description={project.description}
            tags={project.tags}
            image={project.image}
            onClick={() =>
              setSelectedOverlay({
                title: project.name,
                description: project.description,
                githubUrl: project.source_code_link,
                photos: project.photos || [],
              })
            }
          />
        ))}
      </div>

      {/* GitHub pinned repos */}
      {repos.length > 0 && (
        <>
          <motion.div variants={textVariant()} className="mt-16">
            <p className={`${styles.sectionSubText}`}>Open Source</p>
            <h3 className="text-white font-bold text-[30px]">
              GitHub Pinned.
            </h3>
          </motion.div>

          <div className="mt-10 flex flex-wrap gap-7">
            {repos.map((repo, index) => (
              <GitHubProjectCard
                key={repo.id}
                index={index}
                repo={repo}
                onClick={() =>
                  setSelectedOverlay({
                    title: repo.name,
                    description: repo.description,
                    githubUrl: repo.url,
                    liveUrl: repo.homepageUrl || undefined,
                  })
                }
              />
            ))}
          </div>
        </>
      )}

      {selectedOverlay && (
        <ProjectOverlay
          open
          onClose={() => setSelectedOverlay(null)}
          onBack={() => setSelectedOverlay(null)}
          title={selectedOverlay.title}
          description={selectedOverlay.description}
          githubUrl={selectedOverlay.githubUrl}
          liveUrl={selectedOverlay.liveUrl}
          photos={selectedOverlay.photos}
        />
      )}
    </>
  );
};

const WorksWithWrapper = SectionWrapper(Works, "projects");
export default WorksWithWrapper;
