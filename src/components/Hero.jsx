import { motion } from "framer-motion";
import Card from "@mui/material/Card";
import { styles } from "../styles";
import { ComputersCanvas } from "./canvas";
import Typography from "@mui/material/Typography";
import React from "react";
import profilePicture from "../assets/IMG_2862.png";
const Hero = () => {
    return (
        <section className={`relative w-full h-screen mx-auto`}>
            <div
                className={`absolute inset-0 top-[120px] max-w-7xl mx-auto ${styles.paddingX} flex flex-row items-start gap-5 justify-between`}
            >
                {/* Left Side - Text Section */}
                <div className='flex flex-row'>
                    <div className='flex flex-col justify-center items-center mt-5'>
                        <div className='w-5 h-5 rounded-full bg-[#915EFF]' />
                        <div className='w-1 sm:h-80 h-40 violet-gradient' />
                    </div>

                    <div>
                        <h1 className={`${styles.heroHeadText} text-white`}>
                            Hi, I'm <span className='text-[#915EFF]'>Sizhuo Long</span>
                        </h1>
                        <p className={`${styles.heroSubText} mt-2 text-white-100`}>
                            Open-source enthusiast skilled in Python, Golang, and Javascript.{" "}
                            <br className='sm:block hidden' />
                            <Typography variant="body1">
                                <strong>Email:</strong>{" "}
                                <a href="mailto:longsizhuo@gmail.com">longsizhuo@gmail.com</a>
                                <br />
                                <strong>GitHub:</strong>{" "}
                                <a href="https://github.com/longsizhuo">github.com/longsizhuo</a>{" "}
                                <br />
                                <strong>Blog:</strong>{" "}
                                <a href="https://longsizhuo.github.io">longsizhuo.github.io</a>{" "}
                                <br />
                                <strong>LinkedIn:</strong>{" "}
                                <a href="https://linkedin.com/in/longsizhuo">linkedin.com/in/longsizhuo</a>
                            </Typography>
                        </p>
                    </div>
                </div>

                {/* Right Side - Card with Profile Picture */}
                <Card
                    sx={{
                        width: '640px', // Adjust width as per your need
                        height: 'auto',
                        boxShadow: 20, // Adds a shadow for depth
                        borderRadius: '20px',
                        overflow: 'hidden', // Ensures image fits well inside the card
                        transition: 'transform 0.2s', // For hover effect
                        "&:hover": {
                            transform: 'scale(1.05)', // Grows on hover for a subtle effect
                            boxShadow: 12, // Stronger shadow on hover
                        },
                    }}
                    className="flex justify-center items-center"
                >
                    <img
                        src={ profilePicture }
                        alt="Sizhuo Long"
                        style={{
                            width: '100%', // The image will take full card width
                            height: 'auto',
                            objectFit: 'cover',
                        }}
                    />
                </Card>
            </div>

        {/*<ComputersCanvas />*/}

        <div className='absolute xs:bottom-10 bottom-32 w-full flex justify-center items-center'>
          <a href='#about'>
            <div
                className='w-[35px] h-[64px] rounded-3xl border-4 border-secondary flex justify-center items-start p-2'>
              <motion.div
                  animate={{
                    y: [0, 24, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    repeatType: "loop",
                  }}
                  className='w-3 h-3 rounded-full bg-secondary mb-1'
              />
            </div>
          </a>
        </div>
      </section>
  );
};

export default Hero;
