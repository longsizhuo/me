import axios from "axios";
import { motion } from "framer-motion";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ControlPanel } from "./components/ControlPanel";
import { DisplayArea } from "./components/DisplayArea";
import { SettingsPanel } from "./components/SettingsPanel";
import { API_ENDPOINTS, DEV_CONFIG } from "./config/api";
import { VideoToAsciiConfig } from "./config/types";
import { useCharMetrics } from "./hook/useCharMetrics";
import { useSettings } from "./hook/useSettings";
import {
  clamp,
  generateAsciiFramesFromVideo,
  sanitizeAscii,
} from "./service/VideoToAscii";

/** 与 JSX 保持一致的字符集默认值 */
const DEFAULT_CHARS =
  " .'`^\",:;Il!i~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";

/**
 * ✅ 这里把“配置默认值”显式传入 useSettings，
 *    确保 SettingsPanel / ControlPanel 里的初始数值与 JSX 完全一致。
 *    - frameRate: 10
 *    - resolution: 50
 *    - gamma: 1.2
 *    - emaAlpha: 1
 *    - hysteresis: 0.03
 *    - edgeAware: true
 *    - edgeThreshold: 0.18
 *    - edgeStyle: 'paren'
 *    - enableBackend: false
 *    - backendToken: localStorage('ascii_token') || ""
 *    - characters: DEFAULT_CHARS
 */
const buildInitialConfig = (
  incoming?: VideoToAsciiConfig
): VideoToAsciiConfig => {
  const token =
    (typeof window !== "undefined"
      ? localStorage.getItem("ascii_token")
      : null) || "";

  return {
    // UI 文案（可由外部覆盖）
    title: incoming?.title ?? "视频转ASCII动画",
    description:
      incoming?.description ?? "上传视频，将其转换为ASCII字符动画效果",
    showTitle: incoming?.showTitle ?? true,
    showDescription: incoming?.showDescription ?? true,
    enableFileUpload: incoming?.enableFileUpload ?? true,

    // 字符集默认
    defaultCharacters: incoming?.defaultCharacters ?? DEFAULT_CHARS,

    // ⚙️ 所有参数的默认值（与 JSX 一致）
    defaults: {
      // 分辨率(行数) & 帧率
      resolution: incoming?.defaults?.resolution ?? 50,
      frameRate: incoming?.defaults?.frameRate ?? 10,

      // 画质 / 稳定性
      gamma: incoming?.defaults?.gamma ?? 1.2,
      emaAlpha: incoming?.defaults?.emaAlpha ?? 1, // 与 JSX：useState(1)
      hysteresis: incoming?.defaults?.hysteresis ?? 0.03,
      edgeAware: incoming?.defaults?.edgeAware ?? true,
      edgeThreshold: incoming?.defaults?.edgeThreshold ?? 0.18,
      edgeStyle: incoming?.defaults?.edgeStyle ?? "paren",

      // 后端开关与口令
      enableBackend: incoming?.defaults?.enableBackend ?? false,
      backendToken: incoming?.defaults?.backendToken ?? token,

      // 字符集
      characters: incoming?.defaults?.characters ?? DEFAULT_CHARS,
    },

    // 其余回调透传
    onError: incoming?.onError,
  };
};

/**
 * ✅ TSX 版父组件（合并修复+默认值对齐 JSX）
 * - 保留 JSX 中的中文注释与分区（“后端调用”“隐藏的 video/canvas”“让 ASCII 铺满不溢出”）
 * - 恢复“根据容器尺寸自适应字号”的逻辑（迁到 <DisplayArea/> 中）
 * - 统一将“合并后的 frames”传给面板与显示区，避免 UI/状态不同步
 * - 默认数值完全与 JSX 版一致（见上面的 buildInitialConfig）
 */
const VideoToAscii = ({ config = {} }: { config?: VideoToAsciiConfig }) => {
  // ********************** 设置系统（这里显式注入默认值，确保与 JSX 一致） **********************
  const initialConfig = useMemo(() => buildInitialConfig(config), [config]);
  const {
    settings,
    updateSetting,
    resetToDefaults,
    config: mergedConfig,
  } = useSettings(initialConfig);

  // ********************** 运行态状态管理 **********************
  const [, setVideoFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessingBackend, setIsProcessingBackend] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [asciiFrames, setAsciiFrames] = useState<string[][]>([]);
  const [backendAsciiFrames, setBackendAsciiFrames] = useState<string[][]>([]);
  const [useBackendResult, setUseBackendResult] = useState(false);

  // ********************** Refs **********************
  // 隐藏的 video/canvas（与 JSX 一致：用于前端抽帧）
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const isPlayingRef = useRef(false);

  const { wPerFs, hPerFs } = useCharMetrics();
  const charRatio = hPerFs && wPerFs ? hPerFs / wPerFs : 2; // 与 JSX 相同

  // ********************** 处理视频帧（前端） **********************
  // 计算相关函数已移至 ../service/VideoToAscii
  const processVideoFrames = useCallback(
    async (video: HTMLVideoElement) => {
      const rows = clamp(settings.resolution, 20, 120);
      const vw = video.videoWidth || 16;
      const vh = video.videoHeight || 9;
      const cols = clamp(
        Math.round(rows * (vw / vh) * (hPerFs / wPerFs)),
        20,
        480
      );

      const frames = await generateAsciiFramesFromVideo(video, {
        rows,
        cols,
        frameRate: settings.frameRate,
        characters:
          sanitizeAscii(settings.characters) ||
          mergedConfig.defaultCharacters ||
          "",
        canvas: canvasRef.current || undefined,
      });
      return frames;
    },
    [
      settings.resolution,
      settings.frameRate,
      settings.characters,
      hPerFs,
      wPerFs,
      mergedConfig.defaultCharacters,
    ]
  );

  // ********************** 后端调用（与 JSX 一致） **********************
  // 🔒 新增：是否启用后端 & 口令 —— 在 settings 中
  const sendVideoToBackend = async (file: File) => {
    if (!settings.enableBackend) return;

    const token = settings.backendToken.trim();
    if (!token) {
      alert("未填写口令，已仅用前端预览");
      return;
    }

    setIsProcessingBackend(true);

    const rows = clamp(settings.resolution, 20, 120);
    const vw = videoRef.current?.videoWidth || 16;
    const vh = videoRef.current?.videoHeight || 9;
    const cols = clamp(Math.round(rows * (vw / vh) * charRatio), 20, 480);

    const formData = new FormData();
    formData.append("video", file);
    formData.append(
      "characters",
      sanitizeAscii(settings.characters) || mergedConfig.defaultCharacters || ""
    );
    formData.append("frameRate", String(clamp(settings.frameRate, 5, 24)));
    formData.append("rows", String(rows));
    formData.append("cols", String(cols));
    formData.append("invert", "true");
    formData.append("gamma", "0.9");

    try {
      const resp = await axios.post(API_ENDPOINTS.VIDEO_TO_ASCII, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "X-Ascii-Token": token, // 🔒 口令放 Header（与 JSX 注释一致）
        },
        timeout: DEV_CONFIG.TIMEOUT,
        withCredentials: false,
      });
      if (resp.data?.success) {
        setBackendAsciiFrames(resp.data.frames || []);
        setUseBackendResult(true);
      } else {
        throw new Error(resp.data?.error || "后端处理失败");
      }
    } catch (e) {
      console.error(e);
      alert("后端处理失败或口令错误，已仅用前端预览");
    } finally {
      setIsProcessingBackend(false);
    }
  };

  // ********************** 文件上传处理（与 JSX 一致） **********************
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      alert("请上传视频文件");
      return;
    }
    setVideoFile(file);
    setIsProcessing(true);
    setUseBackendResult(false);
    setAsciiFrames([]);
    setBackendAsciiFrames([]);
    setCurrentFrame(0);

    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;

    const video = videoRef.current;
    if (!video) return;

    const onMeta = async () => {
      try {
        const frames = await processVideoFrames(video);
        setAsciiFrames(frames);
        setCurrentFrame(0);
      } catch (err) {
        console.error(err);
        if (mergedConfig.onError) {
          mergedConfig.onError(err as Error);
        }
      } finally {
        setIsProcessing(false);
        // 只有开启开关且 token 存在时才走后端
        await sendVideoToBackend(file);
      }
    };

    video.removeEventListener("loadedmetadata", onMeta);
    video.addEventListener("loadedmetadata", onMeta, { once: true });
    video.src = url;
  };

  // ********************** 播放控制（与 JSX 一致） **********************
  const play = useCallback(() => {
    const frames = useBackendResult ? backendAsciiFrames : asciiFrames;
    if (!frames.length) return;
    setIsPlaying(true);
    isPlayingRef.current = true;
    let i = currentFrame;
    const tick = () => {
      if (!isPlayingRef.current) return;
      setCurrentFrame(i);
      i = (i + 1) % frames.length;
      animationRef.current = setTimeout(
        tick,
        1000 / clamp(settings.frameRate, 5, 24)
      );
    };
    tick();
  }, [
    asciiFrames,
    backendAsciiFrames,
    useBackendResult,
    currentFrame,
    settings.frameRate,
  ]);

  const stop = useCallback(() => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    if (animationRef.current) clearTimeout(animationRef.current);
  }, []);

  const reset = useCallback(() => {
    stop();
    setCurrentFrame(0);
  }, [stop]);

  // 切换显示前端/后端结果（与 JSX 一致）
  const toggleBackendResult = (useBackend: boolean) => {
    setUseBackendResult(useBackend);
  };

  // 清理（与 JSX 一致）
  useEffect(() => {
    return () => {
      if (animationRef.current) clearTimeout(animationRef.current);
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  // ✅ 统一使用“合并后的 frames”供左/右两侧使用，避免状态不同步
  const framesCombined = useBackendResult ? backendAsciiFrames : asciiFrames;

  return (
    <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-16">
      {/* 标题区域（与 JSX 一致，受 config 控制） */}
      {mergedConfig.showTitle && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h2 className="text-white font-black md:text-[60px] sm:text-[50px] xs:text-[40px] text-[30px] text-center">
            {mergedConfig.title}
          </h2>
          {mergedConfig.showDescription && (
            <p className="text-center text-secondary text-lg mt-4">
              {mergedConfig.description}
            </p>
          )}
        </motion.div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* 左侧控制面板 */}
        <div className="lg:w-1/3 space-y-6 top-4 self-start">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {/* 设置面板（包含：帧率/行数/字符集/平滑参数/边缘等 —— 对应 JSX “画质与稳定性”区块） */}
            <SettingsPanel
              settings={settings}
              updateSetting={updateSetting}
              resetToDefaults={resetToDefaults}
              config={mergedConfig}
            />

            {/* 文件上传（与 JSX 一致） */}
            {mergedConfig.enableFileUpload && (
              <div className="mt-6">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                />
              </div>
            )}

            {/* 控制面板（播放/暂停/重置 + 切换前端/后端） */}
            <div className="mt-6">
              <ControlPanel
                settings={settings}
                isPlaying={isPlaying}
                isProcessing={isProcessing}
                isProcessingBackend={isProcessingBackend}
                // ✅ 传入合并后的帧，避免和右侧显示不一致
                frames={framesCombined}
                backendFrames={backendAsciiFrames}
                useBackendResult={useBackendResult}
                currentFrame={currentFrame}
                onPlay={play}
                onStop={stop}
                onReset={reset}
                onToggleBackendResult={toggleBackendResult}
              />
            </div>
          </motion.div>
        </div>

        {/* 右侧显示区域 */}
        <div className="lg:w-2/3">
          <DisplayArea
            frames={framesCombined} // ✅ 与左侧一致
            currentFrame={currentFrame}
            useBackendResult={useBackendResult}
            resolution={settings.resolution}
            // height={540} // 可选：留空即默认 540
          />
        </div>
      </div>

      {/* 隐藏的video/canvas —— 与 JSX 一致：用于前端抽帧 */}
      <video
        ref={videoRef}
        style={{ display: "none" }}
        crossOrigin="anonymous"
      />
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
};

export default VideoToAscii;
