import React from "react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";

import { styles } from "../styles";
import { SectionWrapper } from "../hoc";
import { fadeIn, textVariant } from "../utils/motion.ts";

interface FriendLink {
  name: string;
  url: string;
  img: string;
  description: string;
}

const friendLinks: FriendLink[] = [
  {
    name: "吉吉博客",
    url: "https://mmdjiji.com",
    img: "https://mmdjiji.com/images/avatar.png",
    description: "自古吉吉萌萌哒 ( •̀ ω •́ )✧",
  },
];

const Friends = () => {
  const { t } = useTranslation();
  return (
    <>
      <motion.div variants={textVariant()}>
        <p className={styles.sectionSubText}>{t("friends.subtitle")}</p>
        <h2 className={styles.sectionHeadText}>{t("friends.title")}</h2>
      </motion.div>

      <motion.p
        variants={fadeIn("", "", 0.1, 1)}
        className="mt-4 text-secondary text-[17px] max-w-3xl leading-[30px]"
      >
        {t("friends.description")}
      </motion.p>

      <div className="mt-10 flex flex-wrap gap-5">
        {friendLinks.map((link, index) => (
          <motion.a
            key={link.url}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            variants={fadeIn("up", "spring", index * 0.15, 0.5)}
            className="bg-tertiary p-5 rounded-2xl hover:bg-black-100 transition-colors duration-200 group flex items-center gap-4 min-w-[280px]"
          >
            <img
              src={link.img}
              alt={link.name}
              loading="lazy"
              className="w-14 h-14 rounded-full object-cover shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://github.com/longsizhuo.png";
              }}
            />
            <div className="min-w-0">
              <h3 className="text-white font-semibold text-[16px] group-hover:text-[#915EFF] transition-colors">
                {link.name}
              </h3>
              <p className="mt-1 text-secondary text-[13px] leading-[18px] truncate">
                {link.description}
              </p>
            </div>
          </motion.a>
        ))}
      </div>
    </>
  );
};

const FriendsWithWrapper = SectionWrapper(Friends, "friends");
export default FriendsWithWrapper;
