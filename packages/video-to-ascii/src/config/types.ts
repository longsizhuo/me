// VideoToAscii 组件的配置接口

export interface VideoToAsciiConfig {
  // 基础配置
  enableBackend?: boolean;
  backendToken?: string;
  autoSaveSettings?: boolean;

  // 显示配置
  title?: string;
  description?: string;
  showTitle?: boolean;
  showDescription?: boolean;

  // 视频处理配置
  defaultCharacters?: string;
  defaultResolution?: number;
  defaultFrameRate?: number;

  // 画质与稳定性配置
  enableGamma?: boolean;
  enableEma?: boolean;
  enableHysteresis?: boolean;
  enableEdgeAware?: boolean;

  // 默认值
  defaultGamma?: number;
  defaultEmaAlpha?: number;
  defaultHysteresis?: number;
  defaultEdgeThreshold?: number;
  defaultEdgeStyle?: "paren" | "bracket" | "mixed";

  // 样式配置
  theme?: "dark" | "light" | "auto";
  primaryColor?: string;
  backgroundColor?: string;

  // 功能开关
  enableFileUpload?: boolean;
  enableCharacterCustomization?: boolean;
  enableResolutionControl?: boolean;
  enableFrameRateControl?: boolean;
  enableAdvancedSettings?: boolean;
  enableBackendToggle?: boolean;

  // 回调函数
  onVideoProcessed?: (frames: string[][]) => void;
  onSettingsChanged?: (settings: any) => void;
  onError?: (error: Error) => void;
}

// 默认配置
export const DEFAULT_CONFIG: VideoToAsciiConfig = {
  // 基础配置
  enableBackend: false,
  backendToken: "",
  autoSaveSettings: true,

  // 显示配置
  title: "视频转ASCII动画",
  description: "上传视频，将其转换为ASCII字符动画效果",
  showTitle: true,
  showDescription: true,

  // 视频处理配置
  defaultCharacters:
    " .'`^\",:;Il!i~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",
  defaultResolution: 50,
  defaultFrameRate: 10,

  // 画质与稳定性配置
  enableGamma: true,
  enableEma: true,
  enableHysteresis: true,
  enableEdgeAware: true,

  // 默认值
  defaultGamma: 1.2,
  defaultEmaAlpha: 0.25,
  defaultHysteresis: 0.03,
  defaultEdgeThreshold: 0.18,
  defaultEdgeStyle: "paren",

  // 样式配置
  theme: "dark",
  primaryColor: "#3B82F6",
  backgroundColor: "#1F2937",

  // 功能开关
  enableFileUpload: true,
  enableCharacterCustomization: true,
  enableResolutionControl: true,
  enableFrameRateControl: true,
  enableAdvancedSettings: true,
  enableBackendToggle: true,
};

// 用户设置接口
export interface UserSettings {
  gamma: number;
  emaAlpha: number;
  hysteresis: number;
  edgeAware: boolean;
  edgeThreshold: number;
  edgeStyle: "paren" | "bracket" | "mixed";
  characters: string;
  resolution: number;
  frameRate: number;
  backendToken: string;
  enableBackend: boolean;
}
