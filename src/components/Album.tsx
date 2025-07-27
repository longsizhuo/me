/**
 * Album 组件 - 照片相册展示
 * 功能：递归遍历 assets/KwaiStudent 文件夹下的所有照片并以瀑布流形式展示
 */
import React from 'react';
import { Image } from 'antd';
import { useEffect, useState } from 'react';
import { SectionWrapper } from '../hoc';
import { motion } from 'motion/react';
import { styles } from '../styles';
import { fadeIn, textVariant } from '../utils/motion.ts';

// 为 Vite 的 import.meta.glob 添加类型声明
declare global {
  interface ImportMeta {
    glob(pattern: string, options?: any): Record<string, any>;
  }
}


type AlbumMap = Record<string, string[]>;

/**
 * 获取 KwaiStudent 文件夹下的所有照片
 * 使用 Vite 的 import.meta.glob 功能动态导入图片文件
 * @returns {Array} 图片路径数组
 */
const getGroupedImages = (): AlbumMap => {
    // 加载所有图片（递归子目录）
    const imageModules = import.meta.glob('/src/assets/album/**/*.{jpg,jpeg,png,webp,gif}', {
      eager: true,
      import: 'default'
    });
  
    const grouped: AlbumMap = {};
  
    for (const path in imageModules) {
      const src = imageModules[path] as string;
  
      // 提取子目录名（例如 202507NewHere）
      const match = path.match(/album\/([^\/]+)\//);
      const folder = match?.[1] ?? 'Uncategorized';
  
      if (!grouped[folder]) grouped[folder] = [];
      grouped[folder].push(src);
    }
  
    return grouped;
  };

/**
 * Album 组件 - 照片相册
 * 展示 KwaiStudent 文件夹下的所有照片，支持图片预览
 **/
const Album = () => {
  const [albumMap, setAlbumMap] = useState<AlbumMap>({});
  const gap = 16;
  const columnWidth = 250;

  useEffect(() => {
    const grouped = getGroupedImages();
    setAlbumMap(grouped);
  }, []);

  return (
    <div
      className="p-4 shadow-inner overflow-y-scroll transparent"
      style={{ maxHeight: "520px", width: "100%"}}
    >
      <motion.div 
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        variants={textVariant()}
      >
                <p className={styles.sectionSubText}>Album</p>
                <h2 className={styles.sectionHeadText}>KwaiStudent</h2>
            </motion.div>

            <motion.p
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={fadeIn("", "", 0.1, 1)}
                className='mt-4 text-secondary text-[17px] max-w-3xl leading-[30px]'
            >
              Below are some of the photos I have taken during my time in the company.
            </motion.p>
      <Image.PreviewGroup>
        {Object.entries(albumMap).map(([folderName, imageList]) => (
          <div key={folderName} style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, margin: '16px 0', color: '#fff' }}>
              {folderName}
            </h2>
            <div
              style={{
                columnCount: Math.floor(window.innerWidth / columnWidth),
                columnGap: gap,
              }}
            >
              {imageList.map((src, idx) => (
                <div
                  key={idx}
                  style={{
                    breakInside: "avoid",
                    marginBottom: `${gap}px`,
                    borderRadius: "12px",
                    overflow: "hidden",
                  }}
                >
                  <Image
                    src={src}
                    alt={`${folderName}-${idx}`}
                    style={{
                      width: "100%",
                      height: "auto",
                      borderRadius: 12,
                      objectFit: "cover",
                    }}
                    placeholder
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </Image.PreviewGroup>
    </div>
  );
};

// 使用 SectionWrapper 高阶组件包装，添加动画效果
export default SectionWrapper(Album, "album");
