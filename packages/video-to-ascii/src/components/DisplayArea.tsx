import React, { useEffect, useMemo, useRef, useState } from "react";
import { useCharMetrics } from "../hook/useCharMetrics";

// 简单 clamp（同 JSX 原逻辑）
const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

type Props = {
  frames: string[][];
  currentFrame: number;
  useBackendResult: boolean;
  // 仅用于右下角信息展示（与 JSX 一致：显示“分辨率(行数)”）
  resolution?: number;
  // 固定视口高度 —— 与旧版 JSX 保持一致（style={{ height: 540 }})
  height?: number;
};

/**
 * 显示区域
 * - ✅ 核心：根据“容器尺寸 + 字符单元宽高”计算自适应字号
 * - ✅ 让 ASCII 正好“铺满但不溢出”（沿用 JSX 的 fsByW / fsByH 方案）
 * - ✅ 固定高度容器 + 居中 grid（与旧版 JSX 的容器结构一致）
 * - ✅ whiteSpace: 'pre' 保证不换行
 */
export const DisplayArea: React.FC<Props> = ({
  frames,
  currentFrame,
  useBackendResult,
  resolution,
  height = 540, // ✅ 保持与 JSX 一致的固定视口高度
}) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(12);
  const { wPerFs, hPerFs } = useCharMetrics(); // ✅ 字符宽高度量（同 JSX）

  // 当前帧（字符串数组）
  const frameLines = frames?.[currentFrame] ?? [];

  // 从实际帧内容推导 rows/cols（避免依赖 <video> 宽高；更稳）
  const rows = useMemo(() => frameLines.length || 1, [frameLines]);
  const cols = useMemo(
    () => (rows > 0 ? frameLines[0]?.length || 1 : 1),
    [frameLines, rows]
  );

  useEffect(() => {
    if (!viewportRef.current || !wPerFs || !hPerFs || rows === 0 || cols === 0)
      return;

    const el = viewportRef.current;

    // ✅ 使用 ResizeObserver：容器尺寸变化时重新计算字号
    const ro = new ResizeObserver(() => {
      const vw = el.clientWidth;
      const vh = el.clientHeight;

      // ✅ 让 ASCII 正好“铺满但不溢出”
      const fsByW = vw / (cols * wPerFs);
      const fsByH = vh / (rows * hPerFs);
      const fs = Math.max(6, Math.floor(Math.min(fsByW, fsByH))); // 最小 6px（与 JSX 相同）
      setFontSize(fs);
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, [wPerFs, hPerFs, rows, cols]);

  return (
    <div
      className="bg-black p-4 rounded-2xl"
      style={{ height }} // ✅ 固定视口高度
    >
      <div
        ref={viewportRef}
        className="w-full h-full overflow-auto grid place-items-center" // ✅ 居中，与 JSX 一致
      >
        {frames?.length ? (
          <div className="text-center">
            <pre
              className="font-mono text-green-400"
              style={{
                lineHeight: 1,
                letterSpacing: 0,
                margin: 0,
                whiteSpace: "pre", // ✅ 关键：不换行渲染 ASCII
                fontSize, // ✅ 关键：使用自适应字号（与 JSX 一致）
              }}
            >
              {frameLines.join("\n")}
            </pre>

            {/* 右下角信息 —— 与 JSX 一致 */}
            <div className="mt-4 text-sm text-gray-400">
              帧 {currentFrame + 1} / {frames.length}
              {typeof resolution === "number" && (
                <span className="ml-2">· 行数 {resolution}</span>
              )}
              {useBackendResult && (
                <span className="text-green-400 ml-2">(后端处理)</span>
              )}
            </div>
          </div>
        ) : (
          // 空状态（与 JSX 一致）
          <div className="text-center text-gray-500">
            <p className="text-lg mb-2">上传视频开始转换</p>
            <p className="text-sm">支持 MP4, WebM, AVI 等格式</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DisplayArea;
