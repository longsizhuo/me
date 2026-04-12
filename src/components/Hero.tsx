import { motion } from "motion/react";
import Card from "@mui/material/Card";
import { styles } from "../styles";
import Typography from "@mui/material/Typography";
import React, { useState } from "react";
import profilePicture from "../assets/IMG_2862.png";

const Hero = () => {
  const [giggle, setGiggle] = useState(false);

  return (
    <section className={`relative w-full h-screen mx-auto`}>
      <div
        className={`absolute inset-0 top-[120px] max-w-7xl mx-auto ${styles.paddingX} flex flex-col xl:flex-row items-start gap-5 justify-between`}
      >
        {/* Left Side - Text Section */}
        <div className="flex flex-row">
          <div className="flex flex-col justify-center items-center mt-5">
            <div className="w-5 h-5 rounded-full bg-[#915EFF]" />
            <div className="w-1 sm:h-80 h-40 violet-gradient" />
          </div>

          <div>
            <h1 className={`${styles.heroHeadText} text-white`}>
              Hi, I&apos;m{" "}
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
                Siz Long
              </motion.span>
            </h1>
            <div className={`${styles.heroSubText} mt-2 text-white-100`}>
              <p className="text-[16px] sm:text-[20px] text-secondary leading-[30px] max-w-xl">
                Full-stack developer & open-source enthusiast based in Sydney.
                Frontend Engineer at Kwai, Casual Academic at UNSW.
                Hot cocoa lover, Elden Ring completionist, and proud owner of
                42 perfect game completions on Steam.
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
                <a href="https://longsizhuo.github.io">longsizhuo.github.io</a>
                <br />
                <strong>LinkedIn:</strong>{" "}
                <a href="https://linkedin.com/in/longsizhuo">
                  linkedin.com/in/longsizhuo
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
            width: { xs: "100%", sm: "400px", lg: "500px", xl: "640px" },
            height: "auto",
            boxShadow: 20,
            borderRadius: "20px",
            overflow: "hidden",
            transition: "transform 0.2s",
            flexShrink: 0,
            display: { xs: "none", md: "block" },
            "&:hover": {
              transform: "scale(1.05)",
              boxShadow: 12,
            },
          }}
          className="flex justify-center items-center"
        >
          <img
            src={profilePicture}
            alt="Sizhuo Long"
            style={{ width: "100%", height: "auto", objectFit: "cover" }}
          />
        </Card>
      </div>

      <div className="absolute xs:bottom-10 bottom-32 w-full flex justify-center items-center">
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
