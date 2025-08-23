import axios from "axios";
import { motion } from "framer-motion";
import React, { useCallback, useEffect, useRef, useState } from "react";
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

const VideoToAscii = ({ config = {} }: { config?: VideoToAsciiConfig }) => {
  // 使用配置系统
  const {
    settings,
    updateSetting,
    resetToDefaults,
    config: mergedConfig,
  } = useSettings(config);

  // 状态管理
  const [, setVideoFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessingBackend, setIsProcessingBackend] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [asciiFrames, setAsciiFrames] = useState<string[][]>([]);
  const [backendAsciiFrames, setBackendAsciiFrames] = useState<string[][]>([]);
  const [useBackendResult, setUseBackendResult] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const isPlayingRef = useRef(false);

  const { wPerFs, hPerFs } = useCharMetrics();
  const charRatio = hPerFs && wPerFs ? hPerFs / wPerFs : 2;

  // 处理视频帧
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

  // 后端调用
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
          "X-Ascii-Token": token,
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

  // 文件上传处理
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

  // 播放控制
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

  // 切换后端结果
  const toggleBackendResult = (useBackend: boolean) => {
    setUseBackendResult(useBackend);
  };

  // 清理
  useEffect(() => {
    return () => {
      if (animationRef.current) clearTimeout(animationRef.current);
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const frames = useBackendResult ? backendAsciiFrames : asciiFrames;

  return (
    <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-16">
      {/* 标题区域 */}
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
            {/* 设置面板 */}
            <SettingsPanel
              settings={settings}
              updateSetting={updateSetting}
              resetToDefaults={resetToDefaults}
              config={mergedConfig}
            />

            {/* 文件上传 */}
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

            {/* 控制面板 */}
            <div className="mt-6">
              <ControlPanel
                settings={settings}
                isPlaying={isPlaying}
                isProcessing={isProcessing}
                isProcessingBackend={isProcessingBackend}
                frames={asciiFrames}
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
            frames={frames}
            currentFrame={currentFrame}
            useBackendResult={useBackendResult}
            resolution={settings.resolution}
          />
        </div>
      </div>

      {/* 隐藏的video/canvas */}
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
