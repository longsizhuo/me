import React, { useEffect, useRef, useState } from "react";
import { UserSettings } from "../config/types";

interface ControlPanelProps {
  settings: UserSettings;
  isPlaying: boolean;
  isProcessing: boolean;
  isProcessingBackend: boolean;
  frames: string[][];
  backendFrames: string[][];
  useBackendResult: boolean;
  currentFrame: number;
  onPlay: () => void;
  onStop: () => void;
  onReset: () => void;
  onToggleBackendResult: (useBackend: boolean) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  settings,
  isPlaying,
  isProcessing,
  isProcessingBackend,
  frames,
  backendFrames,
  useBackendResult,
  currentFrame,
  onPlay,
  onStop,
  onReset,
  onToggleBackendResult,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 120 }); // 避免被标题栏遮挡
  const positionRef = useRef(position);
  const [isMinimized, setIsMinimized] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // 拖拽处理
  const handleMouseDown = (e: React.MouseEvent) => {
    // 只有点击拖拽手柄区域才能拖拽
    if ((e.target as HTMLElement).closest(".drag-handle")) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX - positionRef.current.x,
        y: e.clientY - positionRef.current.y,
      };
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && dragStartRef.current) {
      const newX = e.clientX - dragStartRef.current.x;
      const newY = e.clientY - dragStartRef.current.y;

      // 限制在视口范围内
      const maxX = window.innerWidth - (panelRef.current?.offsetWidth || 300);
      const maxY = window.innerHeight - (panelRef.current?.offsetHeight || 200);

      const x = Math.max(0, Math.min(newX, maxX));
      const y = Math.max(0, Math.min(newY, maxY));

      positionRef.current = { x, y };

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        if (panelRef.current) {
          panelRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        }
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setPosition(positionRef.current);
  };

  // 全局鼠标事件监听
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging]);

  useEffect(() => {
    if (panelRef.current) {
      const { x, y } = position;
      panelRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      positionRef.current = { x, y };
    }
  }, [position]);

  // 悬浮面板样式
  const panelStyle = {
    position: "fixed" as const,
    left: 0,
    top: 0,
    zIndex: 9999, // 提高层级，避免被遮挡
    cursor: isDragging ? "grabbing" : "default",
    minWidth: "280px",
    maxWidth: "320px",
    willChange: "transform" as const,
  };

  return (
    <div
      ref={panelRef}
      style={panelStyle}
      className={`bg-tertiary rounded-2xl shadow-2xl border border-gray-600 transition-all duration-200 select-none ${
        isMinimized ? "h-12 overflow-hidden" : "h-auto"
      }`}
      onMouseDown={handleMouseDown}
    >
      {/* 拖拽手柄 */}
      <div className="drag-handle bg-gray-700 px-4 py-2 rounded-t-2xl cursor-grab active:cursor-grabbing flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-500 rounded-full animate-pulse"></div>
          <h3 className="text-white font-semibold text-sm">控制面板</h3>
          <span className="text-xs text-gray-400">(拖拽移动)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-gray-300 hover:text-white text-xs px-2 py-1 rounded hover:bg-gray-600"
          >
            {isMinimized ? "展开" : "收起"}
          </button>
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
        </div>
      </div>

      {!isMinimized && (
        <div className="p-4 space-y-4">
          {/* 切换显示结果 */}
          {frames.length > 0 && backendFrames.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                选择显示结果
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => onToggleBackendResult(false)}
                  className={`px-3 py-1 text-sm rounded ${
                    !useBackendResult
                      ? "bg-blue-600 text-white"
                      : "bg-gray-600 text-gray-300"
                  }`}
                >
                  前端预览
                </button>
                <button
                  onClick={() => onToggleBackendResult(true)}
                  className={`px-3 py-1 text-sm rounded ${
                    useBackendResult
                      ? "bg-green-600 text-white"
                      : "bg-gray-600 text-gray-300"
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
              onClick={isPlaying ? onStop : onPlay}
              disabled={
                frames.length === 0 || isProcessing || isProcessingBackend
              }
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isPlaying ? "暂停" : "播放"}
            </button>
            <button
              onClick={onReset}
              disabled={frames.length === 0}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
            >
              重置
            </button>
          </div>

          {/* 状态显示 */}
          {isProcessing && (
            <div className="mt-4 text-center">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              <p className="text-sm text-gray-300 mt-2">正在生成预览...</p>
            </div>
          )}

          {isProcessingBackend && settings.enableBackend && (
            <div className="mt-4 text-center">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
              <p className="text-sm text-gray-300 mt-2">后端正在处理...</p>
            </div>
          )}

          {/* 帧信息 */}
          {frames.length > 0 && (
            <div className="text-center text-sm text-gray-400">
              帧 {currentFrame + 1} / {frames.length}
              {useBackendResult && (
                <span className="text-green-400 ml-2">(后端处理)</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
