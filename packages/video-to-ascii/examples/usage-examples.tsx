import React from "react";
import { DEFAULT_CONFIG, VideoToAscii, VideoToAsciiConfig } from "../src";

// 基础使用示例
export const BasicUsage: React.FC = () => {
  return <VideoToAscii />;
};

// 自定义配置示例 - 禁用后端功能
export const NoBackendUsage: React.FC = () => {
  const config: VideoToAsciiConfig = {
    enableBackendToggle: false,
    enableBackend: false,
    title: "视频转ASCII（仅前端）",
    description: "使用前端处理，无需后端服务",
  };

  return <VideoToAscii config={config} />;
};

// 自定义配置示例 - 简化界面
export const SimpleUsage: React.FC = () => {
  const config: VideoToAsciiConfig = {
    title: "简单转换器",
    description: "只保留核心功能",
    enableAdvancedSettings: false,
    enableCharacterCustomization: false,
    enableResolutionControl: false,
    enableFrameRateControl: false,
    showDescription: false,
  };

  return <VideoToAscii config={config} />;
};

// 自定义配置示例 - 专业模式
export const ProfessionalUsage: React.FC = () => {
  const config: VideoToAsciiConfig = {
    title: "专业视频转换器",
    description: "包含所有高级功能和后端处理",
    enableBackend: true,
    enableBackendToggle: true,
    enableAdvancedSettings: true,
    enableGamma: true,
    enableEma: true,
    enableHysteresis: true,
    enableEdgeAware: true,
    defaultGamma: 1.5,
    defaultEmaAlpha: 0.15,
    defaultHysteresis: 0.05,
    defaultEdgeThreshold: 0.12,
    defaultResolution: 80,
    defaultFrameRate: 15,
    onVideoProcessed: (frames) => {
      console.log(`处理完成，共生成 ${frames.length} 帧`);
    },
    onSettingsChanged: (settings) => {
      console.log("设置已更新:", settings);
    },
    onError: (error) => {
      console.error("处理出错:", error);
    },
  };

  return <VideoToAscii config={config} />;
};

// 自定义配置示例 - 轻量模式
export const LightweightUsage: React.FC = () => {
  const config: VideoToAsciiConfig = {
    title: "轻量转换器",
    description: "专注于核心转换功能",
    enableBackendToggle: false,
    enableBackend: false,
    enableAdvancedSettings: false,
    enableGamma: false,
    enableEma: false,
    enableHysteresis: false,
    enableEdgeAware: false,
    enableCharacterCustomization: false,
    defaultResolution: 40,
    defaultFrameRate: 8,
    autoSaveSettings: false,
  };

  return <VideoToAscii config={config} />;
};

// 自定义配置示例 - 教育模式
export const EducationalUsage: React.FC = () => {
  const config: VideoToAsciiConfig = {
    title: "ASCII艺术学习工具",
    description: "学习ASCII艺术和视频处理原理",
    enableBackendToggle: false,
    enableBackend: false,
    enableAdvancedSettings: true,
    enableGamma: true,
    enableEma: true,
    enableHysteresis: true,
    enableEdgeAware: true,
    enableCharacterCustomization: true,
    enableResolutionControl: true,
    enableFrameRateControl: true,
    defaultCharacters:
      " .'`^\",:;Il!i~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",
    defaultResolution: 30,
    defaultFrameRate: 5,
    onSettingsChanged: (settings) => {
      // 可以在这里添加教学提示
      console.log("参数调整提示:", {
        gamma:
          settings.gamma > 1.5 ? "Gamma值较高，对比度会降低" : "Gamma值适中",
        emaAlpha:
          settings.emaAlpha < 0.3
            ? "平滑度较高，画面更稳定"
            : "平滑度较低，响应更快",
      });
    },
  };

  return <VideoToAscii config={config} />;
};

// 主应用示例
export const App: React.FC = () => {
  const [selectedMode, setSelectedMode] = React.useState<
    "basic" | "simple" | "professional" | "lightweight" | "educational"
  >("basic");

  const getConfig = (): VideoToAsciiConfig => {
    switch (selectedMode) {
      case "simple":
        return {
          title: "简单转换器",
          description: "只保留核心功能",
          enableAdvancedSettings: false,
          enableCharacterCustomization: false,
          enableResolutionControl: false,
          enableFrameRateControl: false,
          showDescription: false,
        };
      case "professional":
        return {
          title: "专业视频转换器",
          description: "包含所有高级功能和后端处理",
          enableBackend: true,
          enableBackendToggle: true,
          enableAdvancedSettings: true,
          enableGamma: true,
          enableEma: true,
          enableHysteresis: true,
          enableEdgeAware: true,
          defaultGamma: 1.5,
          defaultEmaAlpha: 0.15,
          defaultHysteresis: 0.05,
          defaultEdgeThreshold: 0.12,
          defaultResolution: 80,
          defaultFrameRate: 15,
        };
      case "lightweight":
        return {
          title: "轻量转换器",
          description: "专注于核心转换功能",
          enableBackendToggle: false,
          enableBackend: false,
          enableAdvancedSettings: false,
          enableGamma: false,
          enableEma: false,
          enableHysteresis: false,
          enableEdgeAware: false,
          enableCharacterCustomization: false,
          defaultResolution: 40,
          defaultFrameRate: 8,
          autoSaveSettings: false,
        };
      case "educational":
        return {
          title: "ASCII艺术学习工具",
          description: "学习ASCII艺术和视频处理原理",
          enableBackendToggle: false,
          enableBackend: false,
          enableAdvancedSettings: true,
          enableGamma: true,
          enableEma: true,
          enableHysteresis: true,
          enableEdgeAware: true,
          enableCharacterCustomization: true,
          enableResolutionControl: true,
          enableFrameRateControl: true,
          defaultResolution: 30,
          defaultFrameRate: 5,
        };
      default:
        return DEFAULT_CONFIG;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* 模式选择器 */}
      <div className="bg-gray-800 p-4 border-b border-gray-700">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">VideoToAscii 组件演示</h1>
          <div className="flex flex-wrap gap-2">
            {[
              { key: "basic", label: "基础模式" },
              { key: "simple", label: "简单模式" },
              { key: "professional", label: "专业模式" },
              { key: "lightweight", label: "轻量模式" },
              { key: "educational", label: "教育模式" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSelectedMode(key as any)}
                className={`px-4 py-2 rounded-md transition-colors ${
                  selectedMode === key
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 组件渲染 */}
      <VideoToAscii config={getConfig()} />
    </div>
  );
};
