import React from "react";
import { motion } from "motion/react";

import { styles } from "../styles";
import { SectionWrapper } from "../hoc";
import { fadeIn, textVariant } from "../utils/motion.ts";
import type { EducationCardProps } from "./TYPE";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  const educations = [
    {
      degree: "Master of Engineering — Information Technology",
      university: "The University of New South Wales (UNSW)",
      duration: "Sep 2022 - Sep 2024 | WAM: Distinction",
      coursework:
        "Data Structures & Algorithms, Computer Vision, Web Front-End Programming, Computer Networks, Blockchain App Architecture, Extended AI.",
    },
    {
      degree: "Bachelor of Engineering — Digital Media Technology",
      university: "Chengdu University of Information Technology (CUIT)",
      duration: "Sep 2017 - Jul 2021",
      coursework:
        "Advanced Graphics Programming (OpenGL), Network Game Programming, Data Structures, R Programming.",
    },
  ];

  return (
    <div className={`mt-12 bg-black-100 rounded-[20px]`}>
      <div
        className={`bg-tertiary rounded-2xl ${styles.padding} min-h-[300px]`}
      >
        <motion.div variants={textVariant()}>
          <p className={styles.sectionSubText}>{t("education.subtitle")}</p>
          <h2 className={styles.sectionHeadText}>{t("education.title")}</h2>
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
