import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

interface LazyVisibleProps {
  children: ReactNode;
  /** 触发前的占位高度/尺寸，避免子内容挂载时页面跳动 */
  minHeight?: string | number;
  className?: string;
  /** IntersectionObserver rootMargin —— 提前量，让 chunk 在用户滚到之前就开始下载 */
  rootMargin?: string;
}

/**
 * 懒挂载包装器：占位到接近视口前不渲染 children。
 *
 * 与 Album.tsx 的 LazyImage 是同一套 IntersectionObserver 懒加载写法，
 * 这里抽出来给 three.js 画布（Earth/Stars）复用。
 */
const LazyVisible = ({ children, minHeight, className, rootMargin = "200px" }: LazyVisibleProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }

    let io: IntersectionObserver | undefined;
    const startIO = () => {
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setVisible(true);
              io?.disconnect();
            }
          });
        },
        { rootMargin }
      );
      io.observe(node);
    };

    // ponytail: this page is image-heavy; many below-fold images use native
    // `loading="lazy"` (no reserved aspect-ratio) and don't block `load`, so
    // document height keeps growing for a couple seconds after mount/load.
    // Starting the IntersectionObserver right away can catch a transient
    // short-page layout and wrongly fire "visible" for a target that's
    // actually thousands of px further down. Wait for body height to stop
    // changing (debounced via ResizeObserver, capped so we don't wait
    // forever if something keeps animating) before trusting the first read.
    let settleTimer: ReturnType<typeof setTimeout>;
    const maxWaitTimer = setTimeout(() => {
      ro.disconnect();
      clearTimeout(settleTimer);
      startIO();
    }, 3000);
    const ro = new ResizeObserver(() => {
      clearTimeout(settleTimer);
      settleTimer = setTimeout(() => {
        ro.disconnect();
        clearTimeout(maxWaitTimer);
        startIO();
      }, 300);
    });
    ro.observe(document.body);

    return () => {
      ro.disconnect();
      clearTimeout(settleTimer);
      clearTimeout(maxWaitTimer);
      io?.disconnect();
    };
  }, [rootMargin]);

  const style: CSSProperties | undefined = minHeight !== undefined ? { minHeight } : undefined;

  return (
    <div ref={ref} className={className} style={style}>
      {visible && children}
    </div>
  );
};

export default LazyVisible;
