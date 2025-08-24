import React, { useEffect } from "react";
import { createPortal } from "react-dom";

// 遮罩层的主要样式 - 居中显示，白色背景，最高层级
const overlayStyle = {
  position: "fixed", // 固定定位，相对于视口
  top: "100px", // 顶部边距20px
  left: "100px", // 左侧边距20px
  right: "100px", // 右侧边距20px
  bottom: "100px", // 底部边距20px
  backgroundColor: "#fff", // 白色背景
  zIndex: 9999, // 确保在最上层，提高层级
  overflowY: "auto", // 垂直方向可滚动
  color: "#000", // 黑色文字
  borderRadius: "8px", // 圆角边框
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)", // 阴影效果
};

// 顶部导航栏样式 - 包含返回和关闭按钮
const topBarStyle = {
  display: "flex", // 弹性布局
  justifyContent: "space-between", // 两端对齐
  padding: "10px 20px", // 内边距
  borderBottom: "1px solid #ccc", // 底部边框
};

// 图片网格布局样式 - 响应式网格，自动填充列数
const gridStyle = {
  display: "grid", // 网格布局
  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", // 自动填充列，最小200px
  gap: "10px", // 网格间距
  marginTop: "20px", // 顶部外边距
};

// 按钮样式 - 蓝色主题按钮
const buttonStyle = {
  padding: "10px 20px", // 内边距
  backgroundColor: "#007bff", // 蓝色背景
  color: "#fff", // 白色文字
  border: "none", // 无边框
  borderRadius: "4px", // 圆角
  cursor: "pointer", // 手型光标
};

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
    <div style={overlayStyle}>
      {/* 顶部导航栏 */}
      <div style={topBarStyle}>
        <button onClick={onBack}>Return</button> {/* 返回按钮 */}
        <button onClick={onClose}>Close</button> {/* 关闭按钮 */}
      </div>

      {/* 主要内容区域 */}
      <div style={{ padding: "20px" }}>
        {/* 项目标题 */}
        {title && <h2>{title}</h2>}

        {/* 项目描述 */}
        {description && <p>{description}</p>}

        {/* 项目截图网格 */}
        {photos.length > 0 && (
          <div style={gridStyle}>
            {photos.map((src, index) => (
              <img
                key={index}
                src={src}
                alt={`${title || "project"} screenshot ${index + 1}`} // 图片描述
                style={{ width: "100%", height: "auto" }} // 响应式图片尺寸
              />
            ))}
          </div>
        )}

        {/* GitHub 链接 */}
        {githubUrl && (
          <p style={{ marginTop: "20px" }}>
            <a
              href={githubUrl}
              target="_blank" // 新窗口打开
              rel="noopener noreferrer" // 安全属性
              style={{ color: "#007bff" }}
            >
              GitHub
            </a>
          </p>
        )}

        {/* 在线演示按钮 */}
        {liveUrl && (
          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <button
              style={buttonStyle}
              onClick={() => window.open(liveUrl, "_blank")} // 新窗口打开演示链接
            >
              View
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default ProjectOverlay;
