import React from "react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";

import { styles } from "../styles";
import { SectionWrapper } from "../hoc";
import { fadeIn, textVariant } from "../utils/motion.ts";

interface ArticleItem {
  title: string;
  likes: number;
  platform: "xiaohongshu" | "blog";
  url: string;
  category: string;
}

const articles: ArticleItem[] = [
  // Pinned / Top
  {
    title: '我"转码"过程中的良师 Dr. Eric Martin',
    likes: 1048,
    platform: "xiaohongshu",
    url: "https://www.xiaohongshu.com/explore/6814f561000000002100375d",
    category: "Career",
  },
  {
    title: "你为什么找不到工作",
    likes: 508,
    platform: "xiaohongshu",
    url: "https://www.xiaohongshu.com/explore/68f11f26000000000302134b",
    category: "Career",
  },
  // Tech & Open Source
  {
    title: "挑战开箱一米长的校招礼盒！",
    likes: 181,
    platform: "xiaohongshu",
    url: "https://www.xiaohongshu.com/explore/69c6f2e700000000210399ad",
    category: "Life @ Kuaishou",
  },
  {
    title: "如何利用开源社区学习",
    likes: 152,
    platform: "xiaohongshu",
    url: "https://www.xiaohongshu.com/explore/682b673100000000210015ea",
    category: "Open Source",
  },
  {
    title: "Apex 黑屏解决方案",
    likes: 138,
    platform: "xiaohongshu",
    url: "https://www.xiaohongshu.com/explore/6953e0ad000000001f00a83b",
    category: "Tech",
  },
  {
    title: "《只是为了好玩》",
    likes: 133,
    platform: "xiaohongshu",
    url: "https://www.xiaohongshu.com/explore/69b15c9f0000000015020434",
    category: "Life",
  },
  {
    title: "我们创建了一个开源的学习社区",
    likes: 104,
    platform: "xiaohongshu",
    url: "https://www.xiaohongshu.com/explore/68c68780000000001d003a2f",
    category: "Open Source",
  },
  {
    title: "快手校招培训开始了",
    likes: 93,
    platform: "xiaohongshu",
    url: "https://www.xiaohongshu.com/explore/6874eaed000000001c032b04",
    category: "Life @ Kuaishou",
  },
  {
    title: "如何发布自己的第一个NPM包",
    likes: 90,
    platform: "xiaohongshu",
    url: "https://www.xiaohongshu.com/explore/68a9c10e000000001b034723",
    category: "Tech",
  },
];

const platformBadge = {
  xiaohongshu: { label: "小红书", color: "bg-red-600" },
  blog: { label: "Blog", color: "bg-blue-600" },
};

const Writing = () => {
  const { t } = useTranslation();
  return (
    <>
      <motion.div variants={textVariant()}>
        <p className={styles.sectionSubText}>{t("writing.subtitle")}</p>
        <h2 className={styles.sectionHeadText}>{t("writing.title")}</h2>
      </motion.div>

      <motion.p
        variants={fadeIn("", "", 0.1, 1)}
        className="mt-4 text-secondary text-[17px] max-w-3xl leading-[30px]"
      >
        {t("writing.description_prefix")}{" "}
        <a
          href="https://www.xiaohongshu.com/user/profile/5c0b8cc2000000000601e809"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white hover:underline"
        >
          {t("writing.xhs_label")}
        </a>{" "}
        {t("writing.description_middle")}{" "}
        <a
          href="https://involutionhell.com/docs/CommunityShare/Leetcode"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white hover:underline"
        >
          {t("writing.blog_label")}
        </a>
        {t("writing.description_suffix")}
      </motion.p>

      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {articles.map((article, index) => (
          <motion.a
            key={article.url}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            variants={fadeIn("up", "spring", index * 0.15, 0.5)}
            className="bg-tertiary p-5 rounded-2xl hover:bg-black-100 transition-colors duration-200 group block"
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <span
                className={`${platformBadge[article.platform].color} text-white text-[11px] px-2 py-0.5 rounded-full font-medium`}
              >
                {platformBadge[article.platform].label}
              </span>
              <span className="text-secondary text-[12px] whitespace-nowrap">
                {article.category}
              </span>
            </div>
            <h3 className="text-white font-semibold text-[16px] leading-[22px] group-hover:text-[#915EFF] transition-colors">
              {article.title}
            </h3>
            <p className="mt-2 text-secondary text-[13px]">
              {article.likes} {t("writing.likes")}
            </p>
          </motion.a>
        ))}
      </div>
    </>
  );
};

const WritingWithWrapper = SectionWrapper(Writing, "writing");
export default WritingWithWrapper;
