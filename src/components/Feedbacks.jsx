import { motion } from "motion/react";

import { styles } from "../styles";
import { SectionWrapper } from "../hoc";
import { fadeIn, textVariant } from "../utils/motion";
import { testimonials } from "../constants";

const LegendCard = ({
  index,
  testimonial,
  name,
  designation,
  company,
  image,
}) => (
  <motion.div
    variants={fadeIn("", "spring", index * 0.3, 0.75)}
    className='bg-black-200 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300'
  >
    {/* 图片部分 */}
    <div className='relative'>
      <img
        src={image}
        alt={`legend-${name}`}
        className='w-full h-64 object-cover'
      />
      {/* 可选的渐变遮罩 */}
      <div className='absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300'></div>
    </div>

    {/* 文字描述部分 */}
    <div className='p-4'>
      {testimonial && (
        <p className='text-white text-sm leading-relaxed mb-3 line-clamp-3'>
          {testimonial}
        </p>
      )}
      
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-2'>
          <img
            src={image}
            alt={`avatar-${name}`}
            className='w-6 h-6 rounded-full object-cover'
          />
          <div>
            <p className='text-white font-medium text-xs'>
              {name}
            </p>
            <p className='text-secondary text-xs'>
              {designation} • {company}
            </p>
          </div>
        </div>
        
        {/* 可选的点赞按钮 */}
        <button className='text-white/60 hover:text-white transition-colors duration-200'>
          <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' />
          </svg>
        </button>
      </div>
    </div>
  </motion.div>
);

const LegendList = () => {
  return (
    <div className={`mt-12 bg-black-100 rounded-[20px]`}>
      <div
        className={`bg-tertiary rounded-2xl ${styles.padding} min-h-[300px]`}
      >
        <motion.div variants={textVariant()}>
          <p className={styles.sectionSubText}>What others say</p>
          <h2 className={styles.sectionHeadText}>Legend List.</h2>
        </motion.div>
      </div>
      
      {/* 双列瀑布流布局 */}
      <div className={`-mt-20 pb-14 ${styles.paddingX}`}>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 max-w-6xl mx-auto'>
          {/* 左列 */}
          <div className='space-y-4'>
            {testimonials
              .filter((_, index) => index % 2 === 0)
              .map((testimonial, index) => (
                <LegendCard 
                  key={`left-${testimonial.name}`} 
                  index={index * 2} 
                  {...testimonial} 
                />
              ))}
          </div>
          
          {/* 右列 */}
          <div className='space-y-4'>
            {testimonials
              .filter((_, index) => index % 2 === 1)
              .map((testimonial, index) => (
                <LegendCard 
                  key={`right-${testimonial.name}`} 
                  index={index * 2 + 1} 
                  {...testimonial} 
                />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SectionWrapper(LegendList, "");
