/**
 * Album 组件 - 照片相册展示
 * 功能：递归遍历 assets/album 文件夹下的所有照片，按子文件夹分组并以瀑布流形式展示
 */
import { Image } from "antd";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { SectionWrapper } from "../hoc";
import { styles } from "../styles";
import { fadeIn, textVariant } from "../utils/motion";

const getGroupedImages = () => {
  // 递归加载所有图片（包括子目录）
  const imageModules = import.meta.glob(
    "/src/assets/album/**/*.{jpg,jpeg,png,webp,gif,heic,HEIC}",
    {
      eager: true,
      import: "default",
    }
  );

  const grouped = {};

  for (const path in imageModules) {
    const src = imageModules[path];

    // 提取子目录名（例如 Kwai, 2025-Kwai, 2025-UNSW）
    const match = path.match(/album\/([^\/]+)\//);
    const folder = match?.[1] ?? "Uncategorized";

    if (!grouped[folder]) grouped[folder] = [];
    grouped[folder].push(src);
  }

  return grouped;
};

const Album = () => {
  const [albumMap, setAlbumMap] = useState({});
  const gap = 16;
  const columnWidth = 250;

  useEffect(() => {
    const grouped = getGroupedImages();
    setAlbumMap(grouped);
  }, []);

  return (
    <div className="relative w-full">
      <motion.div variants={textVariant()}>
        <p className={`${styles.sectionSubText} text-white`}>Gallery</p>
        <h2 className={`${styles.sectionHeadText} text-white`}>Photo Album</h2>
      </motion.div>

      <motion.p
        variants={fadeIn("", "", 0.1, 1)}
        className="mt-4 text-white text-[17px] max-w-3xl leading-[30px]"
      >
        Here are my photo collections organized by folders. All photos are
        automatically collected from the assets/album directory.
      </motion.p>

      <div
        id="album-scroll"
        className="p-4 mt-10 bg-transparent shadow-inner overflow-y-scroll border-2 border-white rounded-2xl"
        style={{
          maxHeight: "520px",
          width: "100%",
        }}
      >
        <Image.PreviewGroup>
          {Object.entries(albumMap).map(([folderName, imageList]) => (
            <div key={folderName} style={{ marginBottom: 40 }}>
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: 600,
                  margin: "16px 0",
                  color: "#fff",
                  borderBottom: "2px solid #fff",
                  paddingBottom: "8px",
                }}
              >
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
    </div>
  );
};

const AlbumWithWrapper = SectionWrapper(Album, "album");
export default AlbumWithWrapper;
