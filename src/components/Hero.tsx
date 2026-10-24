import { motion } from "motion/react";
import Card from "@mui/material/Card";
import { styles } from "../styles";
import Typography from "@mui/material/Typography";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { imageUrl } from "../content/images";

// 头像原图（912×1269）已经在 R2 上，交给 Cloudflare 按显示尺寸压成 AVIF/WebP：
// 原来直接发 101KB 的 webp，现在 500 宽约 35KB。912 是原图宽度，再大也没有更清楚
const PROFILE_KEY = "logos/IMG_2862.webp";
const profileSmall = imageUrl(PROFILE_KEY, { width: 500 });
const profileLarge = imageUrl(PROFILE_KEY, { width: 912 });

const Hero = () => {
  const { t } = useTranslation();
  const [giggle, setGiggle] = useState(false);

  return (
    // 至少一屏高、内容比屏幕高时跟着变高（原来固定 h-screen + 内容绝对定位，小屏上文字会溢出到下一屏、压住滚动提示）。
    // svh = 手机浏览器地址栏展开时的可见高度，滚动提示不会被地址栏挡住
    <section className="relative w-full min-h-svh mx-auto">
      {/* pb-32：给底部的滚动提示留位置 */}
      <div
        className={`pt-[120px] pb-32 max-w-7xl mx-auto ${styles.paddingX} flex flex-col min-[900px]:flex-row items-start gap-5 justify-between`}
      >
        {/* Left Side - Text Section */}
        {/* min-w-0：和照片并排时文字这一栏可以收窄，不会把照片挤出去 */}
        <div className="flex flex-row min-w-0">
          <div className="flex flex-col justify-start items-center mt-5">
            <div className="w-5 h-5 rounded-full bg-[#915EFF]" />
            <div className="w-1 sm:h-80 h-40 violet-gradient" />
          </div>

          <div>
            <h1 className={`${styles.heroHeadText} text-white`}>
              {t("hero.greeting")}{" "}
              <motion.span
                className="text-[#915EFF]"
                style={{ display: "inline-block", cursor: "pointer" }}
                animate={
                  giggle
                    ? {
                        x: Math.random() * 400 - 200,
                        y: Math.random() * 200 - 100,
                        rotate: Math.random() * 360,
                        scale: 2,
                      }
                    : { x: 0, y: 0, rotate: 0, scale: 1 }
                }
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                onClick={() => setGiggle(true)}
                onAnimationComplete={() => setGiggle(false)}
              >
                {t("hero.name")}
              </motion.span>
            </h1>
            <div className={`${styles.heroSubText} mt-2 text-white-100`}>
              <p className="text-[16px] sm:text-[20px] text-secondary leading-[30px] max-w-xl">
                {t("hero.bio")}
              </p>
              <Typography
                variant="body1"
                component="div"
                className="mt-4"
                sx={{ "& a": { color: "#aaa6c3", "&:hover": { color: "#fff" } } }}
              >
                <strong>Email:</strong>{" "}
                <a href="mailto:longsizhuo@gmail.com">longsizhuo@gmail.com</a>
                <br />
                <strong>GitHub:</strong>{" "}
                <a href="https://github.com/longsizhuo">github.com/longsizhuo</a>
                <br />
                <strong>Blog:</strong>{" "}
                <a href="https://involutionhell.com">involutionhell.com</a>
                <br />
                <strong>LinkedIn:</strong>{" "}
                <a href="https://linkedin.com/in/longsizhuo">
                  linkedin.com/in/longsizhuo
                </a>
                <br />
                <strong>XHS:</strong>{" "}
                <a href="https://www.xiaohongshu.com/user/profile/5c0b8cc2000000000601e809">
                  @龙龙要打翻你们
                </a>
                <br />
                <strong>Steam:</strong>{" "}
                <a href="https://steamcommunity.com/id/longsizhuo/">
                  Loong Loong
                </a>
              </Typography>
            </div>
          </div>
        </div>

        {/* Right Side - Profile Picture */}
        <Card
          sx={{
            // 900–1200px 屏幕窄，照片缩到 340px 给文字留地方；更宽时保持原来的 500 / 640px
            width: { xs: "100%", md: "340px", lg: "500px", xl: "640px" },
            height: "auto",
            boxShadow: 20,
            borderRadius: "20px",
            overflow: "hidden",
            transition: "transform 0.2s",
            flexShrink: 0,
            // 手机上不显示照片；从 900px（MUI md）起显示，并且和文字左右并排（上面的 min-[900px]:flex-row）。
            // 原来要到 1280px 才并排，900–1280px 之间照片排在文字下面、被挤出首屏
            display: { xs: "none", md: "block" },
            "&:hover": {
              transform: "scale(1.05)",
              boxShadow: 12,
            },
          }}
          className="flex justify-center items-center"
        >
          <img
            src={profileSmall}
            srcSet={`${profileSmall} 500w, ${profileLarge} 912w`}
            // 卡片宽度：xl 640px / lg 500px / md 340px（和上面 Card 的 width 对应）
            sizes="(min-width: 1536px) 640px, (min-width: 1200px) 500px, 340px"
            width={912}
            height={1269}
            alt="Sizhuo Long"
            fetchPriority="high"
            style={{ width: "100%", height: "auto", objectFit: "cover" }}
          />
        </Card>
      </div>

      <div className="absolute bottom-10 w-full flex justify-center items-center">
        <a href="#about">
          <div className="w-[35px] h-[64px] rounded-3xl border-4 border-secondary flex justify-center items-start p-2">
            <motion.div
              animate={{ y: [0, 24, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatType: "loop" }}
              className="w-3 h-3 rounded-full bg-secondary mb-1"
            />
          </div>
        </a>
      </div>
    </section>
  );
};

export default Hero;
