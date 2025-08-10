/**
 * Album 组件 - 照片相册展示
 * 功能：递归遍历 assets/album/Kwai 文件夹下的所有照片并以瀑布流形式展示
 */
import { useEffect, useState } from 'react';
import { Image } from 'antd';
import { SectionWrapper } from '../hoc';
import { motion } from 'framer-motion';
import { styles } from '../styles';
import { textVariant, fadeIn } from '../utils/motion';

const getGroupedImages = () => {
  const imageModules = import.meta.glob('/src/assets/album/Kwai/*.{jpg,jpeg,png,webp,gif}', {
    eager: true,
    import: 'default',
  });

  const images = [];

  for (const path in imageModules) {
    const src = imageModules[path];
    images.push(src);
  }

  return images;
};

const Album = () => {
  const [images, setImages] = useState([]);
  const gap = 16;

  useEffect(() => {
    const imageList = getGroupedImages();
    setImages(imageList);
  }, []);

  return (
    <div className="relative w-full">
      <motion.div variants={textVariant()}>
        <p className={`${styles.sectionSubText} text-white`}>Gallery</p>
        <h2 className={`${styles.sectionHeadText} text-white`}>Kwai 相册</h2>
      </motion.div>

      <motion.p
        variants={fadeIn("", "", 0.1, 1)}
        className="mt-4 text-white text-[17px] max-w-3xl leading-[30px]"
      >
        Here are some of the fun memories captured at Kwai! All photos are automatically collected from the Kwai album folder.
      </motion.p>

      <div
        id="album-scroll"
        className="p-4 mt-10 bg-transparent shadow-inner overflow-y-scroll border-2 border-white rounded-2xl"
        style={{
          maxHeight: '520px',
          width: '100%',
        }}
      >
        <div
          style={{
            columnCount: Math.floor(window.innerWidth / 250),
            columnGap: gap,
          }}
        >
          {images.map((src, index) => (
            <div
              key={index}
              style={{
                breakInside: 'avoid',
                marginBottom: `${gap}px`,
                borderRadius: '12px',
                overflow: 'hidden',
              }}
            >
              <Image
                src={src}
                alt={`kwai-student-${index}`}
                style={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: 12,
                  objectFit: 'cover',
                }}
                placeholder
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const AlbumWithWrapper = SectionWrapper(Album, 'album');
export default AlbumWithWrapper;
