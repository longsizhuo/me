import React from "react";
import { motion } from "motion/react";

import { styles } from "../styles";
import { SectionWrapper } from "../hoc";
import { fadeIn, textVariant } from "../utils/motion.ts";
import type { EducationCardProps } from "./TYPE";

const EducationCard = ({
  degree,
  university,
  duration,
  coursework,
  index,
}: EducationCardProps) => (
  <motion.div
    variants={fadeIn("", "spring", index * 0.5, 0.75)}
    className='bg-black-200 p-10 rounded-3xl xs:w-[400px] w-full'
  >
    <h3 className='text-white font-bold text-[24px]'>{degree}</h3>
    <p className='mt-1 text-secondary text-[18px]'>{university}</p>
    <p className='mt-1 text-secondary text-[14px]'>{duration}</p>
    <p className='mt-4 text-secondary text-[14px]'>{coursework}</p>
  </motion.div>
);

const Education = () => {
  const educations = [
    {
      degree: "Master of Information Technology",
      university: "The University of New South Wales",
      duration: "Sep 2022 - Aug 2024",
      coursework:
        "Relevant Coursework: Data Structures & Algorithms, Computer Vision, Web Front-End Programming, Computer Networks Applications, Blockchain App Architecture.",
    },
    {
      degree: "Bachelor of Digital Media Technology",
      university: "Chengdu University of Information Technology (CUIT)",
      duration: "Sep 2017 - May 2021",
      coursework:
        "Relevant Coursework: Advanced Graphics Programming (OpenGL), Network Game Programming Techniques.",
    },
  ];

  return (
    <div className={`mt-12 bg-black-100 rounded-[20px]`}>
      <div
        className={`bg-tertiary rounded-2xl ${styles.padding} min-h-[300px]`}
      >
        <motion.div variants={textVariant()}>
          <p className={styles.sectionSubText}>My academic background</p>
          <h2 className={styles.sectionHeadText}>Education.</h2>
        </motion.div>
      </div>
      <div className={`-mt-20 pb-14 ${styles.paddingX} flex flex-wrap gap-7`}>
        {educations.map((education, index) => (
          <EducationCard key={education.university} index={index} {...education} />
        ))}
      </div>
    </div>
  );
};

const EducationWithWrapper = SectionWrapper(Education, "education");
export default EducationWithWrapper;
