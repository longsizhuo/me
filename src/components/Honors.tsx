import React from "react";
import { motion } from "motion/react";

import { styles } from "../styles";
import { SectionWrapper } from "../hoc";
import { fadeIn, textVariant } from "../utils/motion.ts";

const honors = [
  {
    title: "Lanqiao Cup — 1st Place",
    issuer: "Lanqiao Cup Competition, International Python (Postgraduate/A)",
    date: "Apr 2024",
    description:
      "Achieved first place in the 15th Lanqiao Cup International Python Algorithm competition.",
  },
  {
    title: "USYD Coding Fest — Champion",
    issuer: "University of Sydney",
    date: "2024",
    description:
      'Won the Outstanding Project Idea Award (Champion) with SpotFinder — an urban parking space time-sharing rental system.',
  },
  {
    title: "UNSW Peter Farrell Cup",
    issuer: "UNSW Incubator",
    date: "Feb 2024",
    description:
      "Selected for the UNSW Peter Farrell Cup Program with SpotFinder project.",
  },
  {
    title: "Patent — Dimensionality Reduction Clustering Tool",
    issuer: "Software Copyright 2021SR1180633",
    date: "Aug 2021",
    description:
      "Patented a visualization tool system for single-cell RNA-seq data dimensionality reduction and clustering analysis.",
  },
];

const HonorCard = ({
  title,
  issuer,
  date,
  description,
  index,
}: {
  title: string;
  issuer: string;
  date: string;
  description: string;
  index: number;
}) => (
  <motion.div
    variants={fadeIn("up", "spring", index * 0.3, 0.75)}
    className="bg-tertiary p-6 rounded-2xl w-full sm:w-[360px]"
  >
    <div className="flex justify-between items-start mb-2">
      <h3 className="text-white font-bold text-[20px] flex-1">{title}</h3>
    </div>
    <p className="text-secondary text-[13px]">
      {issuer} &middot; {date}
    </p>
    <p className="mt-3 text-secondary text-[14px] leading-[22px]">
      {description}
    </p>
  </motion.div>
);

const Honors = () => {
  return (
    <div className="mt-12 bg-black-100 rounded-[20px]">
      <div className={`bg-tertiary rounded-2xl ${styles.padding} min-h-[200px]`}>
        <motion.div variants={textVariant()}>
          <p className={styles.sectionSubText}>Recognition</p>
          <h2 className={styles.sectionHeadText}>Awards & Patents.</h2>
        </motion.div>
      </div>
      <div className={`-mt-20 pb-14 ${styles.paddingX} flex flex-wrap gap-7`}>
        {honors.map((honor, index) => (
          <HonorCard key={honor.title} index={index} {...honor} />
        ))}
      </div>
    </div>
  );
};

const HonorsWithWrapper = SectionWrapper(Honors, "honors");
export default HonorsWithWrapper;
