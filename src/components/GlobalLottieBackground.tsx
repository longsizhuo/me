import { DotLottieReact, type DotLottie } from "@lottiefiles/dotlottie-react";
import { useEffect, useRef, useState } from "react";

export const GlobalLottieBackground = () => {
  const [dotLottie, setDotLottie] = useState<DotLottie | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const lastScrollY = useRef(0);
  const currentFrame = useRef(0);
  const scrollPerFrame = 20;
  // 背景动画不是首屏必需的（播放器的 wasm 就有 600KB），等浏览器忙完首屏再加载
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const start = () => setShouldLoad(true);
    // Safari 没有 requestIdleCallback，退回到 1 秒后加载
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(start, { timeout: 2000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(start, 1000);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!dotLottie) {
      return;
    }

    const waitForLoad = setInterval(() => {
      try {
        if (dotLottie?.isLoaded && dotLottie.totalFrames > 0) {
          setIsReady(true);
          clearInterval(waitForLoad);
        }
      } catch (err) {
        console.warn("Lottie loading error:", err);
        setError(err);
        clearInterval(waitForLoad);
      }
    }, 100);

    return () => clearInterval(waitForLoad);
  }, [dotLottie]);

  useEffect(() => {
    if (!isReady || !dotLottie) {
      return;
    }

    const handleScroll = () => {
      try {
        const deltaY = window.scrollY - lastScrollY.current;
        lastScrollY.current = window.scrollY;
        if (deltaY === 0) {
          return;
        }

        const total = dotLottie.totalFrames;
        const frameDelta = deltaY / scrollPerFrame;
        let nextFrame = currentFrame.current + frameDelta;
        nextFrame = ((nextFrame % total) + total) % total;
        currentFrame.current = nextFrame;
        dotLottie.setFrame(nextFrame);
      } catch (err) {
        console.warn("Scroll handling error:", err);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isReady, dotLottie]);

  const handleLottieRef = (ref: DotLottie | null) => {
    if (ref && typeof ref === "object") {
      setDotLottie(ref);
    }
  };

  if (error || !shouldLoad) {
    return null; // 出错就静默不显示；还没轮到加载时也先不渲染
  }

  return (
    <div className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none">
      <DotLottieReact
        dotLottieRefCallback={handleLottieRef}
        src="https://lottie.host/a6ae4b17-1a57-416f-953d-c1d6794798d6/64AOvOtfsX.lottie"
        autoplay={false}
        loop={true}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
};
