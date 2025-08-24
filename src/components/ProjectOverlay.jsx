import React, { useEffect } from "react";
import { createPortal } from "react-dom";

// 项目遮罩层组件 - 显示项目详细信息和图片
const ProjectOverlay = ({
  open, // 控制遮罩层是否显示
  onClose, // 关闭遮罩层的回调函数
  onBack, // 返回上一级的回调函数
  title, // 项目标题
  description, // 项目描述
  photos = [], // 项目截图数组，默认为空数组
  githubUrl, // GitHub 链接
  liveUrl, // 在线演示链接
}) => {
  // 当 Overlay 打开/关闭时管理滚动状态
  useEffect(() => {
    if (open) {
      // 当 Overlay 打开时，阻止底部滚动
      document.body.style.overflow = "hidden";
    } else {
      // 当 Overlay 关闭时，恢复底部滚动
      document.body.style.overflow = "unset";
    }

    // 清理函数：组件卸载时恢复滚动
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  // 如果未打开，不渲染任何内容
  if (!open) return null;

  // 使用 Portal 直接渲染到 document.body，确保正确的层级
  return createPortal(
    <div className="fixed top-[100px] left-[100px] right-[100px] bottom-[100px] bg-tertiary z-[9999] overflow-y-auto text-white rounded-2xl shadow-card border border-gray-600">
      {/* 顶部导航栏 */}
      <div className="flex justify-between items-center px-5 py-4 border-b border-gray-600 bg-black-100 rounded-t-2xl">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-secondary text-black font-medium rounded-lg hover:bg-white transition-colors duration-200"
        >
          Return
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors duration-200"
        >
          Close
        </button>
      </div>

      {/* 主要内容区域 */}
      <div className="p-6">
        {/* 项目标题 */}
        {title && (
          <h2 className="text-white font-black text-[32px] sm:text-[40px] mb-4 leading-tight">
            {title}
          </h2>
        )}

        {/* 项目描述 */}
        {description && (
          <p className="text-secondary text-[16px] leading-[28px] mb-6">
            {description}
          </p>
        )}

        {/* 项目截图网格 */}
        {photos.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {photos.map((src, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-xl"
              >
                <img
                  src={src}
                  alt={`${title || "project"} screenshot ${index + 1}`}
                  className="w-full h-auto object-cover rounded-xl transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {/* 链接区域 */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          {/* GitHub 链接 */}
          {githubUrl && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-secondary text-black font-semibold rounded-lg hover:bg-white transition-colors duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </a>
          )}

          {/* 在线演示按钮 */}
          {liveUrl && (
            <button
              onClick={() => window.open(liveUrl, "_blank")}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              View Live
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ProjectOverlay;
