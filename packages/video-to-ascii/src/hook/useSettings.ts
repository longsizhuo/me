import { useState } from "react";
import {
    DEFAULT_CONFIG,
    UserSettings,
    VideoToAsciiConfig,
} from "../config/types";

export function useSettings(config: VideoToAsciiConfig = {}) {
  // 合并配置
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  // 初始化用户设置
  const [settings, setSettings] = useState<UserSettings>(() => {
    // 尝试从localStorage恢复设置
    if (mergedConfig.autoSaveSettings) {
      try {
        const saved = localStorage.getItem("video_to_ascii_settings");
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            gamma: parsed.gamma ?? mergedConfig.defaultGamma,
            emaAlpha: parsed.emaAlpha ?? mergedConfig.defaultEmaAlpha,
            hysteresis: parsed.hysteresis ?? mergedConfig.defaultHysteresis,
            edgeAware: parsed.edgeAware ?? mergedConfig.enableEdgeAware,
            edgeThreshold:
              parsed.edgeThreshold ?? mergedConfig.defaultEdgeThreshold,
            edgeStyle: parsed.edgeStyle ?? mergedConfig.defaultEdgeStyle,
            characters: parsed.characters ?? mergedConfig.defaultCharacters,
            resolution: parsed.resolution ?? mergedConfig.defaultResolution,
            frameRate: parsed.frameRate ?? mergedConfig.defaultFrameRate,
            backendToken: parsed.backendToken ?? mergedConfig.backendToken,
            enableBackend: parsed.enableBackend ?? mergedConfig.enableBackend,
          };
        }
      } catch (error) {
        console.warn("Failed to load saved settings:", error);
      }
    }

    // 返回默认设置
    return {
      gamma: mergedConfig.defaultGamma!,
      emaAlpha: mergedConfig.defaultEmaAlpha!,
      hysteresis: mergedConfig.defaultHysteresis!,
      edgeAware: mergedConfig.enableEdgeAware!,
      edgeThreshold: mergedConfig.defaultEdgeThreshold!,
      edgeStyle: mergedConfig.defaultEdgeStyle!,
      characters: mergedConfig.defaultCharacters!,
      resolution: mergedConfig.defaultResolution!,
      frameRate: mergedConfig.defaultFrameRate!,
      backendToken: mergedConfig.backendToken!,
      enableBackend: mergedConfig.enableBackend!,
    };
  });

  // 更新设置
  const updateSetting = <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => {
    setSettings((prev) => {
      const newSettings = { ...prev, [key]: value };

      // 自动保存到localStorage
      if (mergedConfig.autoSaveSettings) {
        try {
          localStorage.setItem(
            "video_to_ascii_settings",
            JSON.stringify(newSettings)
          );
        } catch (error) {
          console.warn("Failed to save settings:", error);
        }
      }

      // 调用回调
      if (mergedConfig.onSettingsChanged) {
        mergedConfig.onSettingsChanged(newSettings);
      }

      return newSettings;
    });
  };

  // 重置设置到默认值
  const resetToDefaults = () => {
    const defaultSettings: UserSettings = {
      gamma: mergedConfig.defaultGamma!,
      emaAlpha: mergedConfig.defaultEmaAlpha!,
      hysteresis: mergedConfig.defaultHysteresis!,
      edgeAware: mergedConfig.enableEdgeAware!,
      edgeThreshold: mergedConfig.defaultEdgeThreshold!,
      edgeStyle: mergedConfig.defaultEdgeStyle!,
      characters: mergedConfig.defaultCharacters!,
      resolution: mergedConfig.defaultResolution!,
      frameRate: mergedConfig.defaultFrameRate!,
      backendToken: mergedConfig.backendToken!,
      enableBackend: mergedConfig.enableBackend!,
    };

    setSettings(defaultSettings);

    if (mergedConfig.autoSaveSettings) {
      try {
        localStorage.setItem(
          "video_to_ascii_settings",
          JSON.stringify(defaultSettings)
        );
      } catch (error) {
        console.warn("Failed to save default settings:", error);
      }
    }
  };

  // 清除所有保存的设置
  const clearSavedSettings = () => {
    if (mergedConfig.autoSaveSettings) {
      try {
        localStorage.removeItem("video_to_ascii_settings");
      } catch (error) {
        console.warn("Failed to clear saved settings:", error);
      }
    }
  };

  return {
    settings,
    updateSetting,
    resetToDefaults,
    clearSavedSettings,
    config: mergedConfig,
  };
}
