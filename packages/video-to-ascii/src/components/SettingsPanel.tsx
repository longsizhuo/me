import React from "react";
import { UserSettings, VideoToAsciiConfig } from "../config/types";

interface SettingsPanelProps {
  settings: UserSettings;
  updateSetting: <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => void;
  resetToDefaults: () => void;
  config: VideoToAsciiConfig;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  updateSetting,
  resetToDefaults,
  config,
}) => {
  return (
    <div className="bg-tertiary p-6 rounded-2xl space-y-6">
      <h3 className="text-xl font-bold mb-4 text-white">设置</h3>

      {/* 后端设置 */}
      {config.enableBackendToggle && (
        <div className="space-y-4">
          <h4 className="text-white font-semibold text-sm border-b border-gray-700 pb-2">
            后端设置
          </h4>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-300">
              使用后端（带口令）
            </label>
            <input
              type="checkbox"
              checked={settings.enableBackend}
              onChange={(e) => updateSetting("enableBackend", e.target.checked)}
            />
          </div>

          {settings.enableBackend && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                后端口令
              </label>
              <input
                type="password"
                value={settings.backendToken}
                onChange={(e) => updateSetting("backendToken", e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                placeholder="输入口令后才会调用后端"
              />
            </div>
          )}
        </div>
      )}

      {/* 文件上传 */}
      {config.enableFileUpload && (
        <div className="space-y-4">
          <h4 className="text-white font-semibold text-sm border-b border-gray-700 pb-2">
            文件设置
          </h4>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              选择视频文件
            </label>
            <input
              type="file"
              accept="video/*"
              className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
            />
          </div>
        </div>
      )}

      {/* 字符集设置 */}
      {config.enableCharacterCustomization && (
        <div className="space-y-4">
          <h4 className="text-white font-semibold text-sm border-b border-gray-700 pb-2">
            字符设置
          </h4>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              ASCII字符集
            </label>
            <input
              type="text"
              value={settings.characters}
              onChange={(e) => updateSetting("characters", e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
              placeholder={config.defaultCharacters}
            />
            <p className="text-xs text-gray-400 mt-1">
              会自动过滤非 ASCII 字符
            </p>
          </div>
        </div>
      )}

      {/* 分辨率设置 */}
      {config.enableResolutionControl && (
        <div className="space-y-4">
          <h4 className="text-white font-semibold text-sm border-b border-gray-700 pb-2">
            分辨率设置
          </h4>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              分辨率(行数): {settings.resolution}
            </label>
            <input
              type="range"
              min="20"
              max="120"
              value={settings.resolution}
              onChange={(e) =>
                updateSetting("resolution", parseInt(e.target.value))
              }
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* 帧率设置 */}
      {config.enableFrameRateControl && (
        <div className="space-y-4">
          <h4 className="text-white font-semibold text-sm border-b border-gray-700 pb-2">
            帧率设置
          </h4>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              帧率: {settings.frameRate} FPS
            </label>
            <input
              type="range"
              min="5"
              max="24"
              value={settings.frameRate}
              onChange={(e) =>
                updateSetting("frameRate", parseInt(e.target.value))
              }
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* 高级设置 */}
      {config.enableAdvancedSettings && (
        <div className="space-y-4">
          <h4 className="text-white font-semibold text-sm border-b border-gray-700 pb-2">
            画质与稳定性
          </h4>

          {/* Gamma 设置 */}
          {config.enableGamma && (
            <label className="block text-xs text-gray-300">
              Gamma（亮度曲线）：
              <b className="ml-1">{settings.gamma.toFixed(2)}</b>
              <input
                type="range"
                min="0.8"
                max="2.0"
                step="0.05"
                value={settings.gamma}
                onChange={(e) =>
                  updateSetting("gamma", parseFloat(e.target.value))
                }
                className="w-full mt-1"
              />
              <span className="text-[11px] text-gray-400">
                更大=中间灰更不敏感，更稳；太大对比会弱
              </span>
            </label>
          )}

          {/* EMA 设置 */}
          {config.enableEma && (
            <label className="block text-xs text-gray-300">
              平滑（EMA）：
              <b className="ml-1">{settings.emaAlpha.toFixed(2)}</b>
              <input
                type="range"
                min="0.00"
                max="1.00"
                step="0.01"
                value={settings.emaAlpha}
                onChange={(e) =>
                  updateSetting("emaAlpha", parseFloat(e.target.value))
                }
                className="w-full mt-1"
              />
              <span className="text-[11px] text-gray-400">
                越小越稳，但响应更慢（建议 0.20~0.30）
              </span>
            </label>
          )}

          {/* 滞回设置 */}
          {config.enableHysteresis && (
            <label className="block text-xs text-gray-300">
              滞回（抗抖）：
              <b className="ml-1">{settings.hysteresis.toFixed(3)}</b>
              <input
                type="range"
                min="0.000"
                max="0.100"
                step="0.005"
                value={settings.hysteresis}
                onChange={(e) =>
                  updateSetting("hysteresis", parseFloat(e.target.value))
                }
                className="w-full mt-1"
              />
              <span className="text-[11px] text-gray-400">
                越大越不易在边界来回跳（建议 0.02~0.05）
              </span>
            </label>
          )}

          {/* 边缘感知设置 */}
          {config.enableEdgeAware && (
            <label className="block text-xs text-gray-300">
              边缘阈值：
              <b className="ml-1">{settings.edgeThreshold.toFixed(2)}</b>
              <input
                type="range"
                min="0.00"
                max="1.00"
                step="0.01"
                value={settings.edgeThreshold}
                onChange={(e) =>
                  updateSetting("edgeThreshold", parseFloat(e.target.value))
                }
                className="w-full mt-1"
              />
              <span className="text-[11px] text-gray-400">
                越低捕捉到的边越多，但噪点也会多
              </span>
            </label>
          )}

          {/* 重置按钮 */}
          <div className="flex gap-2">
            <button
              onClick={resetToDefaults}
              className="px-3 py-1 rounded bg-gray-700 text-gray-100 text-xs hover:bg-gray-600"
            >
              恢复默认
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
