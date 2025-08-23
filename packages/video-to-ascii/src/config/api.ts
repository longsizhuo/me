// API 配置文件
// 根据环境变量设置不同的后端地址

const isDevelopment = import.meta.env.DEV;

// 从环境变量读取API地址，如果没有设置则使用默认值
const getApiBaseUrl = () => {
  // 优先使用环境变量
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  // 根据环境使用默认值
  return isDevelopment ? "http://localhost:8181" : "https://me.longsizhuo.com";
};

export const API_BASE_URL = getApiBaseUrl();

export const API_ENDPOINTS = {
  // 视频转ASCII
  VIDEO_TO_ASCII: `${API_BASE_URL}/resume-api/video-to-ascii`,

  // 联系表单
  CONTACT: `${API_BASE_URL}/resume-api/contact`,

  // 健康检查
  HEALTH: `${API_BASE_URL}/resume-api/health`,
};

// 开发环境下的配置
export const DEV_CONFIG = {
  API_BASE_URL: "http://localhost:8181",
  TIMEOUT: 300000, // 5分钟超时
};

// 生产环境下的配置
export const PROD_CONFIG = {
  API_BASE_URL: "https://me.longsizhuo.com",
  TIMEOUT: 300000, // 5分钟超时
};

// 导出当前环境信息
export const ENV_INFO = {
  isDevelopment,
  apiBaseUrl: API_BASE_URL,
  nodeEnv: import.meta.env.MODE,
};
