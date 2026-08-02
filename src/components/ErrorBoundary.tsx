import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** 出错时渲染什么。省略则渲染 null —— 适合纯装饰性区块 */
  fallback?: ReactNode;
  /** 出现在日志里，方便定位是哪一块塌了 */
  label: string;
}

interface State {
  failed: boolean;
}

/**
 * 隔离渲染错误，防止一个区块把整棵 React 树带走。
 *
 * 存在的原因：3D 模型和背景动画现在从 cdn.longsizhuo.com 加载，
 * 网络故障会让 useGLTF 抛出。没有这层的话，整个页面变黑屏。
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[ErrorBoundary:${this.props.label}]`, error, info.componentStack);
  }

  render() {
    if (this.state.failed) {
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}
