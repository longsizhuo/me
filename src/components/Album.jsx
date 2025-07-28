/**
 * Album 组件 - 照片相册展示
 * 功能：递归遍历 assets/album/Kwai 文件夹下的所有照片并以瀑布流形式展示
 */
import React from 'react';
import { Image } from 'antd';
import { useEffect, useState } from 'react';
import { SectionWrapper } from '../hoc';

/**
 * 获取 Kwai 文件夹下的所有照片
 * 使用 Vite 的 import.meta.glob 功能动态导入图片文件
 * @returns {Array} 图片路径数组
 */
const getGroupedImages = () => {
    // 加载所有图片
    const imageModules = import.meta.glob('/src/assets/album/Kwai/*.{jpg,jpeg,png,webp,gif}', {
      eager: true,
      import: 'default'
    });
  
    const images = [];
  
    for (const path in imageModules) {
      const src = imageModules[path];
      images.push(src);
    }
  
    return images;
  };

/**
 * Album 组件 - 照片相册
 * 展示 Kwai 文件夹下的所有照片，支持图片预览
 **/
const Album = () => {
  const [images, setImages] = useState([]);
  const gap = 16;

  useEffect(() => {
    const imageList = getGroupedImages();
    setImages(imageList);
  }, []);

  return (
    <div
      id="album-scroll"
      className="rounded-2xl p-4 bg-white shadow-inner overflow-y-scroll"
      style={{
        maxHeight: "520px",
        width: "100%",
      }}
    >
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Kwai 相册</h2>
      <div
        style={{
          columnCount: Math.floor(window.innerWidth / 250), // 每列宽度为 250px
          columnGap: gap,
        }}
      >
        {images.map((src, index) => (
          <div
            key={index}
            style={{
              breakInside: "avoid",
              marginBottom: `${gap}px`,
              borderRadius: "12px",
              overflow: "hidden",
            }}
          >
            <Image
              src={src}
              alt={`kwai-student-${index}`}
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
  );
};

// 使用 SectionWrapper 高阶组件包装，添加动画效果
export default SectionWrapper(Album, "album");
