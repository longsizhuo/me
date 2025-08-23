import { motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";

interface DisplayAreaProps {
  frames: string[][];
  currentFrame: number;
  useBackendResult: boolean;
  resolution: number;
}

export const DisplayArea: React.FC<DisplayAreaProps> = ({
  frames,
  currentFrame,
  useBackendResult,
  resolution,
}) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(12);

  // 计算字体大小
  useEffect(() => {
    if (!viewportRef.current) return;

    const ro = new ResizeObserver(() => {
      const el = viewportRef.current;
      if (!el) return;

      const vw = el.clientWidth;
      const vh = el.clientHeight;
      const rows = Math.max(20, Math.min(120, resolution));

      // 假设视频宽高比为16:9
      const cols = Math.max(20, Math.min(480, Math.round(rows * (16 / 9) * 2)));

      // 让 ASCII 正好"铺满但不溢出"
      const fsByW = vw / (cols * 8); // 假设字符宽度为8px
      const fsByH = vh / (rows * 16); // 假设字符高度为16px
      const fs = Math.max(6, Math.floor(Math.min(fsByW, fsByH))); // 最小 6px

      setFontSize(fs);
    });

    ro.observe(viewportRef.current);
    return () => ro.disconnect();
  }, [resolution]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-black p-4 rounded-2xl"
      style={{ height: 540 }}
    >
      <div
        ref={viewportRef}
        className="w-full h-full overflow-auto grid place-items-center"
      >
        {frames.length > 0 ? (
          <div className="text-center">
            <pre
              className="font-mono text-green-400"
              style={{
                lineHeight: 1,
                letterSpacing: 0,
                margin: 0,
                whiteSpace: "pre",
                fontSize,
              }}
            >
              {frames[currentFrame]?.join("\n")}
            </pre>
            <div className="mt-4 text-sm text-gray-400">
              帧 {currentFrame + 1} / {frames.length}
              {useBackendResult && (
                <span className="text-green-400 ml-2">(后端处理)</span>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500">
            <p className="text-lg mb-2">上传视频开始转换</p>
            <p className="text-sm">支持 MP4, WebM, AVI 等格式</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
