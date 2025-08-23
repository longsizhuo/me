// 导出主要组件
export { default as VideoToAscii } from "./VideoToAscii";

// 导出配置类型
export { DEFAULT_CONFIG } from "./config/types";
export type { UserSettings, VideoToAsciiConfig } from "./config/types";

// 导出Hook
export { useCharMetrics } from "./hook/useCharMetrics";
export { useSettings } from "./hook/useSettings";

// 导出子组件
export { ControlPanel } from "./components/ControlPanel";
export { DisplayArea } from "./components/DisplayArea";
export { SettingsPanel } from "./components/SettingsPanel";

// 导出服务函数
export {
  clamp,
  generateAsciiFramesFromVideo,
  imageToAscii,
  sanitizeAscii,
} from "./service/VideoToAscii";

// 导出API配置
export { API_ENDPOINTS, DEV_CONFIG, ENV_INFO, PROD_CONFIG } from "./config/api";
