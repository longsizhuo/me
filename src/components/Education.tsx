import React from "react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";

import { styles } from "../styles";
import { SectionWrapper } from "../hoc";
import { fadeIn, textVariant } from "../utils/motion.ts";

const Education = () => {
  const { t } = useTranslation();
  const raw = t("education.items", { returnObjects: true });
  const educations = Array.isArray(raw) ? raw as Array<{
    id: string; degree: string; university: string; duration: string;
    coursework: string; icon: string; iconBg: string;
  }> : [];

  return (
    <div className="mt-12 bg-black-100 rounded-[20px]">
      <div className={`bg-tertiary rounded-2xl ${styles.padding} min-h-[200px]`}>
        <motion.div variants={textVariant()}>
          <p className={styles.sectionSubText}>{t("education.subtitle")}</p>
          <h2 className={styles.sectionHeadText}>{t("education.title")}</h2>
        </motion.div>
      </div>
      <div className={`-mt-20 pb-14 ${styles.paddingX} flex flex-col gap-8`}>
        {educations.map((edu, index) => (
          <motion.div
            key={edu.id}
            variants={fadeIn("up", "spring", index * 0.3, 0.75)}
            className="bg-black-200 p-8 rounded-3xl w-full flex flex-col sm:flex-row gap-6"
          >
            {/* University icon */}
            <div className="flex-shrink-0 flex items-start justify-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: edu.iconBg || "#1a237e" }}
              >
                {edu.icon ? (
                  <img
                    src={edu.icon}
                    alt={edu.university}
                    className="w-[70%] h-[70%] object-contain"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                ) : (
                  <span className="text-white font-bold text-[18px]">
                    {edu.university.split("(")[1]?.replace(")", "") || edu.university.substring(0, 4)}
                  </span>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1">
              <h3 className="text-white font-bold text-[22px]">{edu.degree}</h3>
              <p className="mt-1 text-[#915EFF] text-[16px] font-medium">
                {edu.university}
              </p>
              <p className="mt-1 text-secondary text-[14px]">{edu.duration}</p>
              <div className="mt-4">
                <p className="text-secondary text-[14px] leading-[22px]">
                  {edu.coursework}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const EducationWithWrapper = SectionWrapper(Education, "education");
export default EducationWithWrapper;
