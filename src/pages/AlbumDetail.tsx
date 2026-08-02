import { useCallback, useEffect, useRef, useState } from "react";
import { Image } from "antd";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { styles } from "../styles";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { fadeIn } from "../utils/motion";
import { imageUrl } from "../content/images";
import { cdnUrl } from "../content";
import { ApiError, fetchAlbum, fetchPhotos, type Lang, type Photo } from "../api/album";

const PAGE_SIZE = 12;
const COLUMN_WIDTH = 250;
const GAP = 16;

function toError(err: unknown): Error {
  return err instanceof Error ? err : new Error(String(err));
}

/**
 * One masonry tile. Mirrors src/components/Album.tsx's LazyImage: an
 * IntersectionObserver mounts the real <Image> only once the tile nears the
 * viewport, and `aspectRatio: w/h` reserves the correct slot height up
 * front so nothing jumps as images load in.
 */
function PhotoTile({ photo, alt }: { photo: Photo; alt: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [broken, setBroken] = useState(false);
  const failCount = useRef(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: "300px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        breakInside: "avoid",
        marginBottom: `${GAP}px`,
        borderRadius: 12,
        overflow: "hidden",
        aspectRatio: `${photo.w} / ${photo.h}`,
      }}
      className="bg-tertiary"
    >
      {visible && !broken && (
        <Image
          src={imageUrl(photo.key, { width: 600 })}
          preview={{ src: imageUrl(photo.key, { width: 1600 }) }}
          fallback={cdnUrl(photo.key)}
          alt={alt}
          loading="lazy"
          width="100%"
          style={{ display: "block", width: "100%", objectFit: "cover" }}
          placeholder
          onError={() => {
            // antd's `fallback` swaps in the raw R2 URL when the Images
            // transform fails; that's the common case (quota exceeded) and
            // should still render. Only the SECOND onError — the fallback
            // also failing — means the object is genuinely gone, so hide
            // the tile instead of showing rc-image's broken-image icon.
            failCount.current += 1;
            if (failCount.current >= 2) {
              setBroken(true);
            }
          }}
        />
      )}
    </div>
  );
}

function MasonrySkeleton() {
  const heights = [220, 300, 260, 340, 200, 280];
  return (
    <div style={{ columnWidth: `${COLUMN_WIDTH}px`, columnGap: GAP }}>
      {heights.map((h, i) => (
        <div
          key={i}
          className="bg-tertiary rounded-xl animate-pulse"
          style={{ breakInside: "avoid", marginBottom: `${GAP}px`, height: h }}
        />
      ))}
    </div>
  );
}

const AlbumDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t, i18n } = useTranslation();
  const lang: Lang = i18n.language === "zh" ? "zh" : "en";

  const [meta, setMeta] = useState<{ name: string; description: string; photoCount: number } | null>(
    null,
  );
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const cursorRef = useRef<string | null>(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    if (!slug) {
      return;
    }
    let cancelled = false;
    setMeta(null);
    setPhotos([]);
    setNotFound(false);
    setError(null);
    cursorRef.current = null;
    loadingRef.current = false;

    fetchAlbum(slug, { lang, limit: PAGE_SIZE })
      .then((data) => {
        if (cancelled) {
          return;
        }
        setMeta({ name: data.name, description: data.description, photoCount: data.photoCount });
        setPhotos(data.photos);
        cursorRef.current = data.nextCursor;
      })
      .catch((err: unknown) => {
        if (cancelled) {
          return;
        }
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
        } else {
          setError(toError(err));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [slug, lang]);

  // Stable identity (only changes with slug) so the sentinel's
  // IntersectionObserver below is set up once per album, not re-created on
  // every page load.
  const loadMore = useCallback(() => {
    if (!slug || loadingRef.current || !cursorRef.current) {
      return;
    }
    loadingRef.current = true;
    setLoadingMore(true);
    fetchPhotos(slug, cursorRef.current, PAGE_SIZE)
      .then((page) => {
        setPhotos((prev) => {
          const seen = new Set(prev.map((p) => p.id));
          return [...prev, ...page.photos.filter((p) => !seen.has(p.id))];
        });
        cursorRef.current = page.nextCursor;
      })
      .catch((err: unknown) => {
        // A hiccup fetching page N doesn't invalidate the N-1 photos
        // already on screen — log it and let the next scroll-into-view
        // retry, rather than throwing away a working page for a boundary.
        console.error("[AlbumDetail] loadMore failed", err);
      })
      .finally(() => {
        loadingRef.current = false;
        setLoadingMore(false);
      });
  }, [slug]);

  const sentinelRef = useRef<HTMLDivElement>(null);
  // `photos.length` is deliberately a dependency here, not just `loadMore`:
  // an IntersectionObserver only calls back on a *transition* across the
  // threshold. A page's worth of photos is shorter than one screen (true
  // for every album's page size here), so the sentinel is already
  // intersecting at mount — it fires its one "entered" callback before the
  // first page has even loaded (cursor still null, loadMore() no-ops), and
  // then, since it never *leaves* and re-enters, never fires again,
  // silently stalling pagination after page 1. Re-subscribing on every
  // photos.length change forces a fresh visibility check against the
  // newly-grown layout, so it keeps chain-loading pages until either the
  // sentinel is finally pushed off-screen or the album runs out of pages.
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "400px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore, photos.length]);

  // Thrown during render so the page-level ErrorBoundary in App.tsx catches
  // it and shows the "album unavailable" fallback. 404 is handled locally
  // above instead — an unknown slug is an expected outcome, not a crash.
  if (error) {
    throw error;
  }

  if (notFound) {
    return (
      <div className="relative z-0 bg-primary min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <h1 className={`${styles.sectionHeadText} text-white`}>{t("album.notFoundTitle")}</h1>
          <p className="text-secondary text-[16px] mt-4 max-w-md">{t("album.notFoundMessage")}</p>
          <Link
            to="/album"
            className="mt-8 px-8 py-3 bg-tertiary text-white font-semibold rounded-xl hover:bg-secondary hover:text-black transition-colors duration-200"
          >
            {t("album.backToList")}
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="relative z-0 bg-primary min-h-screen flex flex-col">
      <Navbar />
      <div className="px-4 sm:px-8 pt-28 pb-16 max-w-[1400px] mx-auto flex-1 w-full">
        <Link to="/album" className="text-secondary hover:text-white text-[14px] transition-colors">
          {t("album.backToList")}
        </Link>

        {meta && (
          <motion.div variants={fadeIn("", "", 0.1, 1)} initial="hidden" animate="show" className="mt-4">
            <h1 className={`${styles.sectionHeadText} text-white`}>{meta.name}</h1>
            {meta.description && (
              <p className="mt-2 text-secondary text-[17px] max-w-3xl leading-[30px]">
                {meta.description}
              </p>
            )}
            <p className="mt-2 text-secondary text-[14px]">
              {t("album.photoCount", { count: meta.photoCount })}
            </p>
          </motion.div>
        )}

        <div className="mt-10">
          {!meta && <MasonrySkeleton />}

          {meta && (
            <Image.PreviewGroup>
              <div style={{ columnWidth: `${COLUMN_WIDTH}px`, columnGap: GAP }}>
                {photos.map((photo, idx) => (
                  <PhotoTile key={photo.id} photo={photo} alt={`${meta.name}-${idx}`} />
                ))}
              </div>
            </Image.PreviewGroup>
          )}
        </div>

        {/* Infinite-scroll sentinel: same IntersectionObserver idiom as
            LazyVisible.tsx, but deliberately doesn't disconnect after the
            first hit — each new page pushes this node further down, and it
            needs to keep firing as the user keeps scrolling. loadMore()
            itself is the guard against duplicate/overlapping fetches. */}
        <div ref={sentinelRef} style={{ height: 1 }} />
        {loadingMore && (
          <p className="text-center text-secondary text-[14px] py-6">{t("album.loadingMore")}</p>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default AlbumDetail;
