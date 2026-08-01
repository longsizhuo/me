import { Image } from "antd";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { SectionWrapper } from "../hoc";
import { styles } from "../styles";
import { album, cdnUrl, type AlbumPhoto } from "../content";
import { fadeIn, textVariant } from "../utils/motion";

const LazyImage = ({ photo, alt, gap }: { photo: AlbumPhoto; alt: string; gap: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        breakInside: "avoid",
        marginBottom: `${gap}px`,
        borderRadius: 12,
        overflow: "hidden",
        // 加载前先按真实比例占位，消除瀑布流抖动
        aspectRatio: `${photo.w} / ${photo.h}`,
        background: "#151030",
      }}
    >
      {visible && (
        <Image
          src={cdnUrl(photo.key)}
          alt={alt}
          loading="lazy"
          width="100%"
          style={{ display: "block", borderRadius: 12, objectFit: "cover" }}
          placeholder
        />
      )}
    </div>
  );
};

const Album = () => {
  const { t } = useTranslation();
  const gap = 16;
  const columnWidth = 250;

  return (
    <div className="relative w-full">
      <motion.div variants={textVariant()}>
        <p className={styles.sectionSubText}>{t("album.subtitle")}</p>
        <h2 className={styles.sectionHeadText}>{t("album.title")}</h2>
      </motion.div>

      <motion.p
        variants={fadeIn("", "", 0.1, 1)}
        className="mt-4 text-secondary text-[17px] max-w-3xl leading-[30px]"
      >
        {t("album.description")}
      </motion.p>

      <div
        id="album-scroll"
        className="p-4 mt-10 bg-black-100/50 shadow-inner overflow-y-scroll border border-gray-700 rounded-2xl"
        style={{ maxHeight: "520px", width: "100%" }}
      >
        <Image.PreviewGroup>
          {album.map((group) => (
            <div key={group.id} style={{ marginBottom: 40 }}>
              <h2 className="text-white text-[20px] font-semibold my-4 pb-2 border-b border-gray-600">
                {group.folder}
              </h2>
              <div style={{ columnWidth: `${columnWidth}px`, columnGap: gap }}>
                {group.photos.map((photo, idx) => (
                  <LazyImage
                    key={photo.key}
                    photo={photo}
                    alt={`${group.folder}-${idx}`}
                    gap={gap}
                  />
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
