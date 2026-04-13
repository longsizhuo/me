import React from "react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";

import { styles } from "../styles";
import { SectionWrapper } from "../hoc";
import { fadeIn, textVariant } from "../utils/motion.ts";

import lanqiaoLogo from "../assets/awards/lanqiao.svg";
import usydLogo from "../assets/awards/usyd.svg";
import unswLogo from "../assets/company/unsw.png";
import copyrightLogo from "../assets/awards/software-copyright.svg";

const honorIcons = [lanqiaoLogo, usydLogo, unswLogo, copyrightLogo];

const HonorCard = ({
  title,
  issuer,
  date,
  description,
  icon,
  index,
}: {
  title: string;
  issuer: string;
  date: string;
  description: string;
  icon: string;
  index: number;
}) => (
  <motion.div
    variants={fadeIn("up", "spring", index * 0.3, 0.75)}
    className="bg-tertiary p-6 rounded-2xl w-full sm:w-[360px] flex gap-4"
  >
    <div className="flex-shrink-0 mt-1">
      <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
        <img src={icon} alt="" className="w-8 h-8 object-contain" />
      </div>
    </div>
    <div className="flex-1">
      <h3 className="text-white font-bold text-[18px] leading-tight">{title}</h3>
      <p className="text-secondary text-[13px] mt-1">
        {issuer} &middot; {date}
      </p>
      <p className="mt-2 text-secondary text-[14px] leading-[22px]">
        {description}
      </p>
    </div>
  </motion.div>
);

const Honors = () => {
  const { t } = useTranslation();
  const items = Array.isArray(t("honors.items", { returnObjects: true }))
    ? (t("honors.items", { returnObjects: true }) as Array<{
        title: string; issuer: string; date: string; description: string;
      }>)
    : [];

  return (
    <div className="mt-12 bg-black-100 rounded-[20px]">
      <div className={`bg-tertiary rounded-2xl ${styles.padding} min-h-[200px]`}>
        <motion.div variants={textVariant()}>
          <p className={styles.sectionSubText}>{t("honors.subtitle")}</p>
          <h2 className={styles.sectionHeadText}>{t("honors.title")}</h2>
        </motion.div>
      </div>
      <div className={`-mt-20 pb-14 ${styles.paddingX} flex flex-wrap gap-7`}>
        {items.map((honor, index) => (
          <HonorCard
            key={honor.title}
            index={index}
            icon={honorIcons[index] || ""}
            {...honor}
          />
        ))}
      </div>
    </div>
  );
};

const HonorsWithWrapper = SectionWrapper(Honors, "honors");
export default HonorsWithWrapper;
