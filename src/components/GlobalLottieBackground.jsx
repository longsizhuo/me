import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useEffect, useRef, useState } from "react";

export const GlobalLottieBackground = () => {
  const [dotLottie, setDotLottie] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const lastScrollY = useRef(0);
  const currentFrame = useRef(0);
  const scrollPerFrame = 20;

  useEffect(() => {
    if (!dotLottie) return;

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
    if (!isReady || !dotLottie) return;

    const handleScroll = () => {
      try {
        const deltaY = window.scrollY - lastScrollY.current;
        lastScrollY.current = window.scrollY;
        if (deltaY === 0) return;

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

  const handleLottieRef = (ref) => {
    if (ref && typeof ref === "object") {
      setDotLottie(ref);
    }
  };

  if (error) {
    return null; // 静默失败，不显示背景
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
