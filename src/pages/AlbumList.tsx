import { useEffect, useState } from "react";
import { Image } from "antd";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { styles } from "../styles";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { fadeIn } from "../utils/motion";
import { imageUrl } from "../content/images";
import { fetchAlbums, type AlbumSummary, type Lang } from "../api/album";

function CoverImage({ album }: { album: AlbumSummary }) {
  if (!album.coverKey) {
    return null;
  }

  return (
    <Image
      src={imageUrl(album.coverKey, { width: 600, fit: "cover" })}
      alt={album.name}
      preview={false}
      wrapperStyle={{ width: "100%", height: "100%", display: "block" }}
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
      onError={(e) => {
        // No `fallback` prop here on purpose: antd's `fallback` would swap
        // in the raw R2 original (up to 10MB, never meant to be served
        // directly) whenever the Images transform fails. Hide the broken
        // <img> instead and let the aspect-[4/3] bg-black-100/60 box behind
        // it show through — a blank cover is the correct failure mode, a
        // 10MB download is not.
        e.currentTarget.style.display = "none";
      }}
    />
  );
}

function CoverSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-tertiary rounded-2xl overflow-hidden animate-pulse">
          <div className="aspect-[4/3] bg-black-100/60" />
          <div className="p-4">
            <div className="h-4 w-2/3 bg-black-100/60 rounded" />
            <div className="h-3 w-1/3 bg-black-100/60 rounded mt-3" />
          </div>
        </div>
      ))}
    </div>
  );
}

const AlbumList = () => {
  const { t, i18n } = useTranslation();
  const lang: Lang = i18n.language === "zh" ? "zh" : "en";
  const [albums, setAlbums] = useState<AlbumSummary[] | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setAlbums(null);
    setError(null);
    fetchAlbums(lang)
      .then((data) => {
        if (!cancelled) {
          setAlbums(data);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [lang]);

  // Thrown during render (not in the .catch above) so the page-level
  // ErrorBoundary in App.tsx catches it and shows the "album unavailable"
  // fallback instead of a blank page. A 404 has no meaning at this list
  // level (there is no slug yet), so every failure here is "generic".
  if (error) {
    throw error;
  }

  return (
    <div className="relative z-0 bg-primary min-h-screen flex flex-col">
      <Navbar />
      <div className="px-4 sm:px-8 pt-28 pb-16 max-w-[1400px] mx-auto flex-1 w-full">
        <motion.div variants={fadeIn("", "", 0.1, 1)} initial="hidden" animate="show">
          <p className={styles.sectionSubText}>{t("album.subtitle")}</p>
          <h1 className={`${styles.sectionHeadText} mt-2`}>{t("album.title")}</h1>
          <p className="mt-4 text-secondary text-[17px] max-w-3xl leading-[30px]">
            {t("album.description")}
          </p>
        </motion.div>

        {albums === null && <CoverSkeleton />}

        {albums !== null && albums.length === 0 && (
          <p className="mt-12 text-secondary">{t("album.empty")}</p>
        )}

        {albums !== null && albums.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            {albums.map((album, i) => (
              <motion.div
                key={album.slug}
                variants={fadeIn("up", "tween", i * 0.1, 0.6)}
                initial="hidden"
                animate="show"
              >
                <Link
                  to={`/album/${album.slug}`}
                  className="group block bg-tertiary rounded-2xl overflow-hidden hover:-translate-y-1 transition-transform duration-200"
                >
                  <div className="aspect-[4/3] bg-black-100/60 overflow-hidden">
                    <CoverImage album={album} />
                  </div>
                  <div className="p-4">
                    <h2 className="text-white font-semibold text-[18px] group-hover:text-secondary transition-colors">
                      {album.name}
                    </h2>
                    <p className="text-secondary text-[14px] mt-1">
                      {t("album.photoCount", { count: album.photoCount })}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default AlbumList;
