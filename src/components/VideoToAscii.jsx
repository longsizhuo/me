import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { styles } from '../styles';
import { SectionWrapper } from '../hoc';
import { API_ENDPOINTS, DEV_CONFIG } from '../config/api';

const VideoToAscii = () => {
  const [, setVideoFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessingBackend, setIsProcessingBackend] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [asciiFrames, setAsciiFrames] = useState([]);
  const [backendAsciiFrames, setBackendAsciiFrames] = useState([]);
  const [useBackendResult, setUseBackendResult] = useState(false);
  const [characters, setCharacters] = useState(' .:-=+*#%@');
  const [frameRate, setFrameRate] = useState(10);
  const [resolution, setResolution] = useState(50);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const fileInputRef = useRef(null);

  // 将图像数据转换为ASCII字符
  const imageToAscii = useCallback((imageData, width, height, chars) => {
    const ascii = [];
    const stepX = Math.ceil(width / resolution);
    const stepY = Math.ceil(height / resolution);
    
    for (let y = 0; y < height; y += stepY) {
      let line = '';
      for (let x = 0; x < width; x += stepX) {
        const idx = (y * width + x) * 4;
        const r = imageData[idx];
        const g = imageData[idx + 1];
        const b = imageData[idx + 2];
        
        // 计算亮度 (0-255)
        const brightness = (r * 0.299 + g * 0.587 + b * 0.114);
        
        // 将亮度映射到字符
        const charIndex = Math.floor((brightness / 255) * (chars.length - 1));
        line += chars[charIndex];
      }
      ascii.push(line);
    }
    
    return ascii;
  }, [resolution]);

  // 处理视频帧
  const processVideoFrames = useCallback(async (video) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const frames = [];
    
    // 设置canvas尺寸
    canvas.width = resolution * 2;
    canvas.height = resolution;
    
    return new Promise((resolve) => {
      const processFrame = () => {
        if (video.currentTime >= video.duration) {
          resolve(frames);
          return;
        }
        
        // 绘制当前帧到canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // 转换为ASCII
        const asciiFrame = imageToAscii(imageData.data, canvas.width, canvas.height, characters);
        frames.push(asciiFrame);
        
        // 前进到下一帧
        video.currentTime += 1 / frameRate;
        video.addEventListener('seeked', processFrame, { once: true });
      };
      
      video.currentTime = 0;
      video.addEventListener('seeked', processFrame, { once: true });
    });
  }, [frameRate, resolution, characters, imageToAscii]);

  // 发送视频到后端处理
  const sendVideoToBackend = async (file) => {
    setIsProcessingBackend(true);
    
    const formData = new FormData();
    formData.append('video', file);
    formData.append('characters', characters);
    formData.append('frameRate', frameRate.toString());
    formData.append('resolution', resolution.toString());
    
    try {
      const response = await axios.post(API_ENDPOINTS.VIDEO_TO_ASCII, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: DEV_CONFIG.TIMEOUT,
      });
      
      if (response.data.success) {
        setBackendAsciiFrames(response.data.frames);
        setUseBackendResult(true);
        console.log('后端处理完成');
      } else {
        throw new Error(response.data.error || '后端处理失败');
      }
    } catch (error) {
      console.error('后端处理错误:', error);
      alert('后端处理失败，将使用前端预览结果');
    } finally {
      setIsProcessingBackend(false);
    }
  };

  // 处理文件上传
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('video/')) {
      alert('请上传视频文件！');
      return;
    }
    
    setVideoFile(file);
    setIsProcessing(true);
    setUseBackendResult(false);
    
    const video = videoRef.current;
    const url = URL.createObjectURL(file);
    
    video.src = url;
    video.addEventListener('loadedmetadata', async () => {
      try {
        // 前端快速预览
        const frames = await processVideoFrames(video);
        setAsciiFrames(frames);
        setCurrentFrame(0);
        setIsProcessing(false);
        
        // 同时发送到后端进行高质量处理
        sendVideoToBackend(file);
      } catch (error) {
        console.error('处理视频时出错:', error);
        setIsProcessing(false);
      }
    });
  };

  // 播放ASCII动画
  const playAsciiAnimation = useCallback(() => {
    const frames = useBackendResult ? backendAsciiFrames : asciiFrames;
    if (frames.length === 0) return;
    
    setIsPlaying(true);
    let frameIndex = currentFrame;
    
    const animate = () => {
      if (!isPlaying) return;
      
      setCurrentFrame(frameIndex);
      frameIndex = (frameIndex + 1) % frames.length;
      
      animationRef.current = setTimeout(() => {
        animate();
      }, 1000 / frameRate);
    };
    
    animate();
  }, [asciiFrames, backendAsciiFrames, useBackendResult, currentFrame, isPlaying, frameRate]);

  // 停止播放
  const stopAsciiAnimation = () => {
    setIsPlaying(false);
    if (animationRef.current) {
      clearTimeout(animationRef.current);
    }
  };

  // 重置播放
  const resetAsciiAnimation = () => {
    stopAsciiAnimation();
    setCurrentFrame(0);
  };

  // 清理资源
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-16">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h2 className={`${styles.sectionHeadText} text-center`}>
          视频转ASCII动画
        </h2>
        <p className="text-center text-secondary text-lg mt-4">
          上传视频，将其转换为ASCII字符动画效果
        </p>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* 控制面板 */}
        <div className="lg:w-1/3 space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-tertiary p-6 rounded-2xl"
          >
            <h3 className="text-xl font-bold mb-4 text-white">设置</h3>
            
            {/* 文件上传 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                选择视频文件
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
              />
            </div>

            {/* 字符集设置 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                ASCII字符集
              </label>
              <input
                type="text"
                value={characters}
                onChange={(e) => setCharacters(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                placeholder=" .:-=+*#%@"
              />
            </div>

            {/* 分辨率设置 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                分辨率: {resolution}
              </label>
              <input
                type="range"
                min="20"
                max="100"
                value={resolution}
                onChange={(e) => setResolution(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            {/* 帧率设置 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                帧率: {frameRate} FPS
              </label>
              <input
                type="range"
                min="5"
                max="30"
                value={frameRate}
                onChange={(e) => setFrameRate(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            {/* 结果选择 */}
            {asciiFrames.length > 0 && backendAsciiFrames.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  选择显示结果
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setUseBackendResult(false)}
                    className={`px-3 py-1 text-sm rounded ${
                      !useBackendResult 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-600 text-gray-300'
                    }`}
                  >
                    前端预览
                  </button>
                  <button
                    onClick={() => setUseBackendResult(true)}
                    className={`px-3 py-1 text-sm rounded ${
                      useBackendResult 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-600 text-gray-300'
                    }`}
                  >
                    后端高质量
                  </button>
                </div>
              </div>
            )}

            {/* 控制按钮 */}
            <div className="flex gap-2">
              <button
                onClick={isPlaying ? stopAsciiAnimation : playAsciiAnimation}
                disabled={(useBackendResult ? backendAsciiFrames : asciiFrames).length === 0 || isProcessing}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isPlaying ? '暂停' : '播放'}
              </button>
              <button
                onClick={resetAsciiAnimation}
                disabled={(useBackendResult ? backendAsciiFrames : asciiFrames).length === 0}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
              >
                重置
              </button>
            </div>

            {/* 处理状态 */}
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

        {/* ASCII显示区域 */}
        <div className="lg:w-2/3">
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-black p-4 rounded-2xl min-h-[400px] flex items-center justify-center"
          >
            {(useBackendResult ? backendAsciiFrames : asciiFrames).length > 0 ? (
              <div className="text-center">
                <div className="font-mono text-xs leading-none text-green-400 whitespace-pre">
                  {(useBackendResult ? backendAsciiFrames : asciiFrames)[currentFrame]?.map((line, index) => (
                    <div key={index}>{line}</div>
                  ))}
                </div>
                <div className="mt-4 text-sm text-gray-400">
                  帧 {currentFrame + 1} / {(useBackendResult ? backendAsciiFrames : asciiFrames).length}
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

      {/* 隐藏的video和canvas元素 */}
      <video
        ref={videoRef}
        style={{ display: 'none' }}
        crossOrigin="anonymous"
      />
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
      />
    </div>
  );
};

const VideoToAsciiWithWrapper = SectionWrapper(VideoToAscii, "video-to-ascii");
export default VideoToAsciiWithWrapper;
