import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { styles } from '../styles';
import { SectionWrapper } from '../hoc';
import { API_ENDPOINTS, DEV_CONFIG } from '../config/api';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// 1) 在“实际样式”下测量字符格宽高比（charAspect = charHeight / charWidth）
function useMeasuredCharAspect() {
  const [aspect, setAspect] = useState(2); // 经验初值
  useEffect(() => {
    const el = document.createElement('pre');
    // ——务必与显示区域相同的样式——
    el.style.position = 'absolute';
    el.style.visibility = 'hidden';
    el.style.fontFamily = `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'DejaVu Sans Mono', monospace`;
    el.style.fontSize = '12px';     // 跟你的 text-xs 接近
    el.style.lineHeight = '1';      // 和显示区域一致
    el.style.letterSpacing = '0';   // 防止字距影响
    el.style.whiteSpace = 'pre';
    // 用大网格测量更稳定
    const COLS = 120, ROWS = 60;
    el.textContent = Array.from({ length: ROWS }).map(() => 'M'.repeat(COLS)).join('\n');
    document.body.appendChild(el);
    const rect = el.getBoundingClientRect();
    const charW = rect.width / COLS;
    const charH = rect.height / ROWS;
    if (charW > 0 && charH > 0) setAspect(charH / charW);
    document.body.removeChild(el);
  }, []);
  return aspect;
}

const DEFAULT_CHARS = " .'`^\",:;Il!i~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";

const VideoToAscii = () => {
  const [, setVideoFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessingBackend, setIsProcessingBackend] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [asciiFrames, setAsciiFrames] = useState([]);
  const [backendAsciiFrames, setBackendAsciiFrames] = useState([]);
  const [useBackendResult, setUseBackendResult] = useState(false);
  const [characters, setCharacters] = useState(DEFAULT_CHARS);
  const [frameRate, setFrameRate] = useState(10);
  const [resolution, setResolution] = useState(50); // 仍然把它当“行数 rows”

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const fileInputRef = useRef(null);
  const objectUrlRef = useRef(null);
  const isPlayingRef = useRef(false);

  const charAspect = useMeasuredCharAspect(); // ★ 关键：真实字符格宽高比

  // ——把非 ASCII 的全角/宽字符过滤，保证等宽和灰阶可用——
  const sanitizeAscii = (s) => {
    const set = new Set();
    for (const ch of s) {
      const code = ch.charCodeAt(0);
      if (code >= 32 && code <= 126) set.add(ch);
    }
    return Array.from(set).join('');
  };

  // 把 RGBA 像素转换为 ASCII 行（仅前端预览用）
  const imageToAscii = useCallback((imageData, width, height, chars) => {
    const ascii = [];
    // 逐像素映射（预览就不做 area 平均了）
    for (let y = 0; y < height; y++) {
      let line = '';
      const rowOff = y * width * 4;
      for (let x = 0; x < width; x++) {
        const idx = rowOff + x * 4;
        const r = imageData[idx], g = imageData[idx + 1], b = imageData[idx + 2];
        const brightness = r * 0.299 + g * 0.587 + b * 0.114; // 0..255
        const ci = Math.max(0, Math.min(chars.length - 1, Math.floor((brightness / 255) * (chars.length - 1))));
        line += chars[ci];
      }
      ascii.push(line);
    }
    return ascii;
  }, []);

  // 2) 前端预览：基于“行数rows”和 charAspect + 原视频比例 计算 cols
  const processVideoFrames = useCallback(async (video) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const frames = [];

    const rows = clamp(resolution, 20, 120);
    const vw = video.videoWidth || 16;
    const vh = video.videoHeight || 9;
    // ★ 核心换算：cols = rows * (W/H) * charAspect
    const cols = clamp(Math.round(rows * (vw / vh) * charAspect), 20, 480);

    canvas.width = cols;
    canvas.height = rows;

    return new Promise((resolve) => {
      const step = 1 / clamp(frameRate, 5, 24);
      const doFrame = () => {
        if (video.currentTime >= video.duration) return resolve(frames);
        ctx.drawImage(video, 0, 0, cols, rows);
        const imageData = ctx.getImageData(0, 0, cols, rows);
        const ascii = imageToAscii(imageData.data, cols, rows, sanitizeAscii(characters) || DEFAULT_CHARS);
        frames.push(ascii);
        video.currentTime += step;
        video.addEventListener('seeked', doFrame, { once: true });
      };
      video.currentTime = 0;
      video.addEventListener('seeked', doFrame, { once: true });
    });
  }, [resolution, frameRate, characters, imageToAscii, charAspect]);

  // 3) 发送到后端：传 rows/cols（和上面一致），由后端 scale+pad 到该网格
  const sendVideoToBackend = async (file) => {
    setIsProcessingBackend(true);

    // 计算 rows/cols（与预览一致）
    const rows = clamp(resolution, 20, 120);
    const vw = videoRef.current?.videoWidth || 16;
    const vh = videoRef.current?.videoHeight || 9;
    const cols = clamp(Math.round(rows * (vw / vh) * charAspect), 20, 480);

    const formData = new FormData();
    formData.append('video', file);
    formData.append('characters', sanitizeAscii(characters) || DEFAULT_CHARS);
    formData.append('frameRate', String(clamp(frameRate, 5, 24)));
    formData.append('rows', String(rows));
    formData.append('cols', String(cols));
    // 白底片建议反相：也可以做自动判定，这里给开关保留接口（默认 true）
    formData.append('invert', 'true');
    formData.append('gamma', '0.9');

    try {
      const resp = await axios.post(API_ENDPOINTS.VIDEO_TO_ASCII, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: DEV_CONFIG.TIMEOUT,
      });
      if (resp.data?.success) {
        setBackendAsciiFrames(resp.data.frames || []);
        setUseBackendResult(true);
      } else {
        throw new Error(resp.data?.error || '后端处理失败');
      }
    } catch (e) {
      console.error(e);
      alert('后端处理失败，将使用前端预览结果');
    } finally {
      setIsProcessingBackend(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      alert('请上传视频文件'); return;
    }
    setVideoFile(file);
    setIsProcessing(true);
    setUseBackendResult(false);
    setAsciiFrames([]); setBackendAsciiFrames([]); setCurrentFrame(0);

    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;

    const video = videoRef.current;
    const onMeta = async () => {
      try {
        const frames = await processVideoFrames(video);
        setAsciiFrames(frames);
        setCurrentFrame(0);
      } catch (err) {
        console.error(err);
      } finally {
        setIsProcessing(false);
        sendVideoToBackend(file);
      }
    };
    video.removeEventListener('loadedmetadata', onMeta);
    video.addEventListener('loadedmetadata', onMeta, { once: true });
    video.src = url;
  };

  // 播放/停止
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
      animationRef.current = setTimeout(tick, 1000 / clamp(frameRate, 5, 24));
    };
    tick();
  }, [asciiFrames, backendAsciiFrames, useBackendResult, currentFrame, frameRate]);

  const stop = useCallback(() => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    if (animationRef.current) clearTimeout(animationRef.current);
  }, []);
  const reset = useCallback(() => { stop(); setCurrentFrame(0); }, [stop]);

  useEffect(() => {
    return () => {
      if (animationRef.current) clearTimeout(animationRef.current);
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const frames = useBackendResult ? backendAsciiFrames : asciiFrames;

  return (
    <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-16">
      <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
        <h2 className={`${styles.sectionHeadText} text-center`}>视频转ASCII动画</h2>
        <p className="text-center text-secondary text-lg mt-4">上传视频，将其转换为ASCII字符动画效果</p>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* 控制面板 */}
        <div className="lg:w-1/3 space-y-6">
          <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="bg-tertiary p-6 rounded-2xl">
            <h3 className="text-xl font-bold mb-4 text-white">设置</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">选择视频文件</label>
              <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileUpload}
                className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100" />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">ASCII字符集</label>
              <input type="text" value={characters} onChange={(e) => setCharacters(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                placeholder={DEFAULT_CHARS} />
              <p className="text-xs text-gray-400 mt-1">会自动过滤非 ASCII 字符</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">分辨率(行数): {resolution}</label>
              <input type="range" min="20" max="120" value={resolution} onChange={(e) => setResolution(parseInt(e.target.value))} className="w-full" />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">帧率: {frameRate} FPS</label>
              <input type="range" min="5" max="24" value={frameRate} onChange={(e) => setFrameRate(parseInt(e.target.value))} className="w-full" />
            </div>

            {asciiFrames.length > 0 && backendAsciiFrames.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">选择显示结果</label>
                <div className="flex gap-2">
                  <button onClick={() => setUseBackendResult(false)} className={`px-3 py-1 text-sm rounded ${!useBackendResult ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300'}`}>前端预览</button>
                  <button onClick={() => setUseBackendResult(true)} className={`px-3 py-1 text-sm rounded ${useBackendResult ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'}`}>后端高质量</button>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={isPlaying ? stop : play} disabled={(frames.length === 0) || isProcessing || isProcessingBackend}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                {isPlaying ? '暂停' : '播放'}
              </button>
              <button onClick={reset} disabled={frames.length === 0} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50">重置</button>
            </div>

            {isProcessing && (
              <div className="mt-4 text-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                <p className="text-sm text-gray-300 mt-2">正在生成预览...</p>
              </div>
            )}
            {isProcessingBackend && (
              <div className="mt-4 text-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                <p className="text-sm text-gray-300 mt-2">后端正在处理...</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* 显示区域：单个 <pre>，避免每行一个 <div> 的行盒差异 */}
        <div className="lg:w-2/3">
          <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-black p-4 rounded-2xl min-h-[400px] flex items-center justify-center">
            {frames.length > 0 ? (
              <div className="text-center">
                <pre
                  className="font-mono text-xs text-green-400"
                  style={{
                    lineHeight: 1,                 // 与测量保持一致
                    letterSpacing: 0,
                    margin: 0,
                    whiteSpace: 'pre',
                  }}
                >
                  {frames[currentFrame]?.join('\n')}
                </pre>
                <div className="mt-4 text-sm text-gray-400">
                  帧 {currentFrame + 1} / {frames.length}
                  {useBackendResult && <span className="text-green-400 ml-2">(后端处理)</span>}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <p className="text-lg mb-2">上传视频开始转换</p>
                <p className="text-sm">支持 MP4, WebM, AVI 等格式</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* 隐藏的video/canvas */}
      <video ref={videoRef} style={{ display: 'none' }} crossOrigin="anonymous" />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

const VideoToAsciiWithWrapper = SectionWrapper(VideoToAscii, 'video-to-ascii');
export default VideoToAsciiWithWrapper;
