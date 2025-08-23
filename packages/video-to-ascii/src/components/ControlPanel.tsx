import React from "react";
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
  return (
    <div className="bg-tertiary p-6 rounded-2xl space-y-6">
      <h3 className="text-xl font-bold mb-4 text-white">控制</h3>

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
          disabled={frames.length === 0 || isProcessing || isProcessingBackend}
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
  );
};
