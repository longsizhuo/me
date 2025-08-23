# VideoToAscii 通用组件

一个高度可配置的视频转ASCII动画React组件，支持多种使用场景和自定义配置。

## 特性

- 🎯 **高度可配置**: 通过配置对象控制所有功能开关
- 🔧 **模块化设计**: 设置面板、控制面板、显示区域独立组件
- 💾 **自动保存**: 支持本地存储用户设置
- 🎨 **多种主题**: 支持深色、浅色主题
- 📱 **响应式**: 自适应不同屏幕尺寸
- 🚀 **性能优化**: 支持前端和后端处理
- 🎓 **教育友好**: 适合学习和教学使用

## 安装

```bash
npm install @me/video-to-ascii
# 或
yarn add @me/video-to-ascii
# 或
pnpm add @me/video-to-ascii
```

## 基础使用

```tsx
import { VideoToAscii } from "@me/video-to-ascii";

function App() {
  return <VideoToAscii />;
}
```

## 高级配置

### 配置接口

```tsx
import { VideoToAscii, VideoToAsciiConfig } from "@me/video-to-ascii";

const config: VideoToAsciiConfig = {
  // 基础配置
  title: "自定义标题",
  description: "自定义描述",
  showTitle: true,
  showDescription: true,

  // 功能开关
  enableBackend: false,
  enableAdvancedSettings: true,
  enableGamma: true,
  enableEma: true,
  enableHysteresis: true,
  enableEdgeAware: true,

  // 默认值
  defaultResolution: 60,
  defaultFrameRate: 12,
  defaultGamma: 1.3,

  // 回调函数
  onVideoProcessed: (frames) => console.log("处理完成"),
  onSettingsChanged: (settings) => console.log("设置更新"),
  onError: (error) => console.error("处理出错"),
};

function App() {
  return <VideoToAscii config={config} />;
}
```

## 使用场景

### 1. 基础模式（默认）

```tsx
<VideoToAscii />
```

包含所有功能，适合大多数用户。

### 2. 简化模式

```tsx
const simpleConfig: VideoToAsciiConfig = {
  title: "简单转换器",
  enableAdvancedSettings: false,
  enableCharacterCustomization: false,
  enableResolutionControl: false,
  enableFrameRateControl: false,
};

<VideoToAscii config={simpleConfig} />;
```

只保留核心转换功能，界面简洁。

### 3. 专业模式

```tsx
const professionalConfig: VideoToAsciiConfig = {
  title: "专业视频转换器",
  enableBackend: true,
  enableAdvancedSettings: true,
  defaultResolution: 80,
  defaultFrameRate: 15,
  onVideoProcessed: (frames) => {
    console.log(`生成 ${frames.length} 帧`);
  },
};

<VideoToAscii config={professionalConfig} />;
```

包含所有高级功能和后端处理。

### 4. 轻量模式

```tsx
const lightweightConfig: VideoToAsciiConfig = {
  title: "轻量转换器",
  enableBackend: false,
  enableAdvancedSettings: false,
  enableGamma: false,
  enableEma: false,
  enableHysteresis: false,
  enableEdgeAware: false,
  defaultResolution: 40,
  defaultFrameRate: 8,
  autoSaveSettings: false,
};

<VideoToAscii config={lightweightConfig} />;
```

专注于核心功能，性能优先。

### 5. 教育模式

```tsx
const educationalConfig: VideoToAsciiConfig = {
  title: "ASCII艺术学习工具",
  enableBackend: false,
  enableAdvancedSettings: true,
  enableGamma: true,
  enableEma: true,
  enableHysteresis: true,
  enableEdgeAware: true,
  defaultResolution: 30,
  defaultFrameRate: 5,
  onSettingsChanged: (settings) => {
    // 添加教学提示
    console.log("参数调整提示:", {
      gamma: settings.gamma > 1.5 ? "对比度会降低" : "对比度适中",
      emaAlpha: settings.emaAlpha < 0.3 ? "画面更稳定" : "响应更快",
    });
  },
};

<VideoToAscii config={educationalConfig} />;
```

适合学习和教学使用。

## 配置选项详解

### 基础配置

| 选项               | 类型    | 默认值                                  | 说明             |
| ------------------ | ------- | --------------------------------------- | ---------------- |
| `title`            | string  | '视频转ASCII动画'                       | 组件标题         |
| `description`      | string  | '上传视频，将其转换为ASCII字符动画效果' | 组件描述         |
| `showTitle`        | boolean | true                                    | 是否显示标题     |
| `showDescription`  | boolean | true                                    | 是否显示描述     |
| `autoSaveSettings` | boolean | true                                    | 是否自动保存设置 |

### 功能开关

| 选项                           | 类型    | 默认值 | 说明                 |
| ------------------------------ | ------- | ------ | -------------------- |
| `enableBackend`                | boolean | false  | 是否启用后端处理     |
| `enableBackendToggle`          | boolean | true   | 是否显示后端开关     |
| `enableFileUpload`             | boolean | true   | 是否显示文件上传     |
| `enableCharacterCustomization` | boolean | true   | 是否允许自定义字符集 |
| `enableResolutionControl`      | boolean | true   | 是否显示分辨率控制   |
| `enableFrameRateControl`       | boolean | true   | 是否显示帧率控制     |
| `enableAdvancedSettings`       | boolean | true   | 是否显示高级设置     |
| `enableGamma`                  | boolean | true   | 是否启用Gamma调节    |
| `enableEma`                    | boolean | true   | 是否启用EMA平滑      |
| `enableHysteresis`             | boolean | true   | 是否启用滞回抗抖     |
| `enableEdgeAware`              | boolean | true   | 是否启用边缘感知     |

### 默认值

| 选项                   | 类型   | 默认值          | 说明               |
| ---------------------- | ------ | --------------- | ------------------ |
| `defaultCharacters`    | string | 标准ASCII字符集 | 默认字符集         |
| `defaultResolution`    | number | 50              | 默认分辨率（行数） |
| `defaultFrameRate`     | number | 10              | 默认帧率           |
| `defaultGamma`         | number | 1.2             | 默认Gamma值        |
| `defaultEmaAlpha`      | number | 0.25            | 默认EMA平滑系数    |
| `defaultHysteresis`    | number | 0.03            | 默认滞回值         |
| `defaultEdgeThreshold` | number | 0.18            | 默认边缘阈值       |
| `defaultEdgeStyle`     | string | 'paren'         | 默认边缘样式       |

### 回调函数

| 选项                | 类型                             | 说明             |
| ------------------- | -------------------------------- | ---------------- |
| `onVideoProcessed`  | (frames: string[][]) => void     | 视频处理完成回调 |
| `onSettingsChanged` | (settings: UserSettings) => void | 设置变更回调     |
| `onError`           | (error: Error) => void           | 错误处理回调     |

## 组件导出

```tsx
// 主组件
export { VideoToAscii };

// 配置类型
export type { VideoToAsciiConfig, UserSettings };

// 默认配置
export { DEFAULT_CONFIG };

// 子组件
export { SettingsPanel, ControlPanel, DisplayArea };

// Hook
export { useSettings, useCharMetrics };

// 工具函数
export { clamp, sanitizeAscii, imageToAscii, generateAsciiFramesFromVideo };

// API配置
export { API_ENDPOINTS, DEV_CONFIG, PROD_CONFIG, ENV_INFO };
```

## 样式定制

组件使用Tailwind CSS类名，可以通过以下方式定制样式：

1. **覆盖CSS变量**
2. **使用Tailwind配置**
3. **自定义CSS类**

## 浏览器支持

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request！
