import { motion } from "motion/react";

import { styles } from "../styles";
import { staggerContainer } from "../utils/motion.ts";
import type { SectionWrapperType } from "./TYPE";

const StarWrapper: SectionWrapperType = (Component, idName) =>
  function HOC() {
    return (
      <motion.section
        variants={staggerContainer()}
        initial='hidden'
        whileInView='show'
        viewport={{ once: true, amount: 0.05 }}
        className={`${styles.padding} max-w-7xl mx-auto relative z-0`}
      >
        <span className='hash-span' id={idName}>
          &nbsp;
        </span>

        <Component />
      </motion.section>
    );
  };

export default StarWrapper;
