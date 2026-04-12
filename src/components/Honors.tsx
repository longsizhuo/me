import React from "react";
import { motion } from "motion/react";

import { styles } from "../styles";
import { SectionWrapper } from "../hoc";
import { fadeIn, textVariant } from "../utils/motion.ts";
import { useTranslation } from "react-i18next";

// Honors data is loaded from i18n JSON files

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
  const { t } = useTranslation();
  return (
    <div className="mt-12 bg-black-100 rounded-[20px]">
      <div className={`bg-tertiary rounded-2xl ${styles.padding} min-h-[200px]`}>
        <motion.div variants={textVariant()}>
          <p className={styles.sectionSubText}>{t("honors.subtitle")}</p>
          <h2 className={styles.sectionHeadText}>{t("honors.title")}</h2>
        </motion.div>
      </div>
      <div className={`-mt-20 pb-14 ${styles.paddingX} flex flex-wrap gap-7`}>
        {(t("honors.items", { returnObjects: true }) as Array<{
          title: string; issuer: string; date: string; description: string;
        }>).map((honor, index) => (
          <HonorCard key={honor.title} index={index} {...honor} />
        ))}
      </div>
    </div>
  );
};

const HonorsWithWrapper = SectionWrapper(Honors, "honors");
export default HonorsWithWrapper;
