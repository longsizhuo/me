import { useEffect, useState, type RefObject } from "react";

/**
 * 元素现在是否在视口里。
 *
 * 3D 画布（星空、地球）用它在滚出屏幕时把渲染循环停掉：
 * 它们一直在转，但用户看不见的时候还每秒画 60 帧，纯属浪费 CPU/GPU，
 * 滚动页面其他部分时就会卡。
 */
export function useOnScreen(ref: RefObject<Element | null>) {
  const [onScreen, setOnScreen] = useState(true);

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }
    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting));
    io.observe(node);
    return () => io.disconnect();
  }, [ref]);

  return onScreen;
}
