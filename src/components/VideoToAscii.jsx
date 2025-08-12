import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { styles } from '../styles';
import { SectionWrapper } from '../hoc';
import { useCharMetrics } from '../hook/useCharMetrics';
import { API_ENDPOINTS, DEV_CONFIG } from '../config/api';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function useMeasuredCharAspect() {
  const [aspect, setAspect] = useState(2);
  useEffect(() => {
    const el = document.createElement('pre');
    el.style.position = 'absolute';
    el.style.visibility = 'hidden';
    el.style.fontFamily = `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'DejaVu Sans Mono', monospace`;
    el.style.fontSize = '12px';
    el.style.lineHeight = '1';
    el.style.letterSpacing = '0';
    el.style.whiteSpace = 'pre';
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
  const [resolution, setResolution] = useState(50); // 行数 rows

  // 🔒 新增：是否启用后端 & 口令
  const [enableBackend, setEnableBackend] = useState(false);
  const [backendToken, setBackendToken] = useState(localStorage.getItem('ascii_token') || '');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const fileInputRef = useRef(null);
  const objectUrlRef = useRef(null);
  const isPlayingRef = useRef(false);

  const charAspect = useMeasuredCharAspect();

  const sanitizeAscii = (s) => {
    const set = new Set();
    for (const ch of s) {
      const code = ch.charCodeAt(0);
      if (code >= 32 && code <= 126) set.add(ch);
    }
    return Array.from(set).join('');
  };

  const imageToAscii = useCallback((imageData, width, height, chars) => {
    const ascii = [];
    for (let y = 0; y < height; y++) {
      let line = '';
      const rowOff = y * width * 4;
      for (let x = 0; x < width; x++) {
        const idx = rowOff + x * 4;
        const r = imageData[idx], g = imageData[idx + 1], b = imageData[idx + 2];
        const brightness = r * 0.299 + g * 0.587 + b * 0.114;
        const ci = Math.max(0, Math.min(chars.length - 1, Math.floor((brightness / 255) * (chars.length - 1))));
        line += chars[ci];
      }
      ascii.push(line);
    }
    return ascii;
  }, []);


const viewportRef = useRef(null);
const [fontSize, setFontSize] = useState(12);
const { wPerFs, hPerFs } = useCharMetrics();

useEffect(() => {
  if (!viewportRef.current) return;
  const ro = new ResizeObserver(() => {
    const el = viewportRef.current;
    const vw = el.clientWidth;
    const vh = el.clientHeight;
    const rows = clamp(resolution, 20, 120);
    const vwVideo = videoRef.current?.videoWidth || 16;
    const vhVideo = videoRef.current?.videoHeight || 9;
    const cols = clamp(Math.round(rows * (vwVideo / vhVideo) * (hPerFs / wPerFs)), 20, 480);

    // 让 ASCII 正好“铺满但不溢出”
    const fsByW = vw / (cols * wPerFs);
    const fsByH = vh / (rows * hPerFs);
    const fs = Math.max(6, Math.floor(Math.min(fsByW, fsByH))); // 最小 6px
    setFontSize(fs);
  });
  ro.observe(viewportRef.current);
  return () => ro.disconnect();
}, [resolution, wPerFs, hPerFs]);


  const processVideoFrames = useCallback(async (video) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const frames = [];

    const rows = clamp(resolution, 20, 120);
    const vw = video.videoWidth || 16;
    const vh = video.videoHeight || 9;
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

  // ▶️ 后端调用：只有启用且有 token 才发送；否则直接返回
  const sendVideoToBackend = async (file) => {
    if (!enableBackend) return;

    const token = backendToken.trim();
    if (!token) {
      alert('未填写口令，已仅用前端预览'); 
      return;
    }

    setIsProcessingBackend(true);

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
    formData.append('invert', 'true');
    formData.append('gamma', '0.9');

    try {
      const resp = await axios.post(API_ENDPOINTS.VIDEO_TO_ASCII, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-Ascii-Token': token, // 🔒 口令放 Header
        },
        timeout: DEV_CONFIG.TIMEOUT,
        withCredentials: false,
      });
      if (resp.data?.success) {
        setBackendAsciiFrames(resp.data.frames || []);
        setUseBackendResult(true);
      } else {
        throw new Error(resp.data?.error || '后端处理失败');
      }
    } catch (e) {
      console.error(e);
      alert('后端处理失败或口令错误，已仅用前端预览');
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
        // 只有开启开关且 token 存在时才走后端
        await sendVideoToBackend(file);
      }
    };
    video.removeEventListener('loadedmetadata', onMeta);
    video.addEventListener('loadedmetadata', onMeta, { once: true });
    video.src = url;
  };

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

  // 保存 token
  useEffect(() => {
    localStorage.setItem('ascii_token', backendToken || '');
  }, [backendToken]);

  return (
    <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-16">
      <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
        <h2 className={`${styles.sectionHeadText} text-center`}>视频转ASCII动画</h2>
        <p className="text-center text-secondary text-lg mt-4">上传视频，将其转换为ASCII字符动画效果</p>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* 控制面板 */}
        <div className="lg:w-1/3 space-y-6 sticky top-4 self-star">
          <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="bg-tertiary p-6 rounded-2xl">
            <h3 className="text-xl font-bold mb-4 text-white">设置</h3>

            {/* 是否启用后端 */}
            <div className="mb-4 flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300">使用后端（带口令）</label>
              <input
                type="checkbox"
                checked={enableBackend}
                onChange={(e) => setEnableBackend(e.target.checked)}
              />
            </div>

            {/* 口令输入 */}
            {enableBackend && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">后端口令</label>
                <input
                  type="password"
                  value={backendToken}
                  onChange={(e) => setBackendToken(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                  placeholder="输入口令后才会调用后端"
                />
              </div>
            )}

            {/* 文件上传 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">选择视频文件</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
              />
            </div>

            {/* 字符集 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">ASCII字符集</label>
              <input
                type="text"
                value={characters}
                onChange={(e) => setCharacters(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                placeholder={DEFAULT_CHARS}
              />
              <p className="text-xs text-gray-400 mt-1">会自动过滤非 ASCII 字符</p>
            </div>

            {/* 行数 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">分辨率(行数): {resolution}</label>
              <input type="range" min="20" max="120" value={resolution} onChange={(e) => setResolution(parseInt(e.target.value))} className="w-full" />
            </div>

            {/* 帧率 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">帧率: {frameRate} FPS</label>
              <input type="range" min="5" max="24" value={frameRate} onChange={(e) => setFrameRate(parseInt(e.target.value))} className="w-full" />
            </div>

            {/* 切换显示结果 */}
            {asciiFrames.length > 0 && backendAsciiFrames.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">选择显示结果</label>
                <div className="flex gap-2">
                  <button onClick={() => setUseBackendResult(false)} className={`px-3 py-1 text-sm rounded ${!useBackendResult ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300'}`}>前端预览</button>
                  <button onClick={() => setUseBackendResult(true)} className={`px-3 py-1 text-sm rounded ${useBackendResult ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'}`}>后端高质量</button>
                </div>
              </div>
            )}

            {/* 控制按钮 */}
            <div className="flex gap-2">
              <button
                onClick={isPlaying ? () => { setIsPlaying(false); isPlayingRef.current = false; if (animationRef.current) clearTimeout(animationRef.current); } : (() => {
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
                })}
                disabled={(frames.length === 0) || isProcessing || isProcessingBackend}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isPlaying ? '暂停' : '播放'}
              </button>
              <button
                onClick={() => { setIsPlaying(false); isPlayingRef.current = false; if (animationRef.current) clearTimeout(animationRef.current); setCurrentFrame(0); }}
                disabled={frames.length === 0}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
              >
                重置
              </button>
            </div>

            {isProcessing && (
              <div className="mt-4 text-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                <p className="text-sm text-gray-300 mt-2">正在生成预览...</p>
              </div>
            )}
            {isProcessingBackend && enableBackend && (
              <div className="mt-4 text-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                <p className="text-sm text-gray-300 mt-2">后端正在处理...</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* 显示区域 */}
        <div className="lg:w-2/3">
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-black p-4 rounded-2xl"
            style={{ height: 540 }}  // 你可以改成想要的固定高度
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
                      whiteSpace: 'pre',
                      fontSize, // ✅ 关键：使用自适应字号
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
            </div>
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
