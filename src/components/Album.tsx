import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { SectionWrapper } from "../hoc";
import { styles } from "../styles";
import { fadeIn, textVariant } from "../utils/motion";
import { imageUrl } from "../content/images";
import { fetchLatest, type LatestPhoto } from "../api/album";

// Fixed-size tile shared by photos and the trailing "view all" card, so the
// strip reads as one uniform row regardless of each source photo's real
// aspect ratio (imageUrl's fit:"cover" crops the transform itself; this
// class additionally clips via CSS in case a transform ever returns
// something oddly shaped).
const TILE_CLASS =
  "shrink-0 w-[200px] sm:w-[240px] aspect-4/3 rounded-2xl overflow-hidden bg-tertiary";

function PhotoTile({ photo }: { photo: LatestPhoto }) {
  return (
    <div className={TILE_CLASS}>
      <img
        src={imageUrl(photo.key, { width: 400, fit: "cover" })}
        alt=""
        loading="lazy"
        className="w-full h-full object-cover"
        onError={(e) => {
          // No raw-R2 fallback on purpose (see src/content/images.ts's
          // docblock and AlbumList/AlbumDetail's identical convention): a
          // failed transform hides the broken <img> and lets the
          // bg-tertiary placeholder show through instead of ever falling
          // back to a multi-MB original.
          e.currentTarget.style.display = "none";
        }}
      />
    </div>
  );
}

function ViewAllCard() {
  const { t } = useTranslation();
  return (
    <Link
      to="/album"
      className={`${TILE_CLASS} flex items-center justify-center text-center px-4 text-white font-semibold hover:-translate-y-1 hover:bg-black-100/60 transition-all duration-200`}
    >
      {t("album.viewAll")}
    </Link>
  );
}

function StripSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-hidden mt-10">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={`${TILE_CLASS} animate-pulse`} />
      ))}
    </div>
  );
}

const Album = () => {
  const { t } = useTranslation();
  const [photos, setPhotos] = useState<LatestPhoto[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchLatest(12)
      .then((data) => {
        if (!cancelled) {
          setPhotos(data);
        }
      })
      .catch((err: unknown) => {
        // This section sits inside HomePage's page-level ErrorBoundary,
        // which would blank the ENTIRE homepage on an uncaught throw — too
        // costly for one preview strip. Log and degrade to empty instead,
        // unlike AlbumList/AlbumDetail (whole-page routes, where throwing
        // to the boundary is the right call).
        console.error("[Album] fetchLatest failed", err);
        if (!cancelled) {
          setPhotos([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

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

      {photos === null && <StripSkeleton />}

      {photos !== null && photos.length > 0 && (
        <div className="flex gap-4 overflow-x-auto mt-10 pb-2">
          {photos.map((photo) => (
            <PhotoTile key={photo.id} photo={photo} />
          ))}
          <ViewAllCard />
        </div>
      )}
    </div>
  );
};

const AlbumWithWrapper = SectionWrapper(Album, "album");
export default AlbumWithWrapper;
