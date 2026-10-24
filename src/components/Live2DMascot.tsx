import { useEffect } from "react";
import i18n from "../i18n";
import { cdnUrl } from "../content";

// 看板娘初音，从老博客 longsizhuo.github.io 搬过来：同一个 Live2D Cubism 2 模型，
// 贴图从 2048 的 PNG 压成 1024 的 WebP，整个模型 976KB → 478KB，放在 R2（cdn.longsizhuo.com/live2d/miku/）。
// 显示用 l2d-widget（还在维护的 MIT 库；博客上用的 live2d-widget 已经停止维护）。
const MODEL_PATH = cdnUrl("live2d/miku/miku.model.json");
const POSITION_KEY = "live2d-position"; // 拖到哪里，刷新后还在哪里
const HITOKOTO_API = "https://v1.hitokoto.cn/?encode=json";
const TIP_INTERVAL = 16000; // 多久换一句「一言」

async function fetchHitokoto(): Promise<string | null> {
  try {
    const res = await fetch(HITOKOTO_API);
    const data = await res.json();
    return data.from ? `${data.hitokoto} ——${data.from}` : data.hitokoto;
  } catch {
    return null; // 一言接口挂了就继续显示上一句
  }
}

/**
 * 让看板娘能被拖动。l2d-widget 0.1.2 还没有拖动功能：已经给上游提了 PR 加 draggable 选项
 * （https://github.com/hacxy/l2d-widget/pull/103），发版后这段可以删掉，
 * 改成 createWidget({ draggable: { storageKey: POSITION_KEY } })，transitionType 也可以改回默认的滑动。
 */
function makeDraggable(container: HTMLElement, canvas: HTMLCanvasElement) {
  const moveTo = (left: number, top: number) => {
    // 不让拖出屏幕
    const maxLeft = Math.max(0, window.innerWidth - container.offsetWidth);
    const maxTop = Math.max(0, window.innerHeight - container.offsetHeight);
    Object.assign(container.style, {
      left: `${Math.min(Math.max(0, left), maxLeft)}px`,
      top: `${Math.min(Math.max(0, top), maxTop)}px`,
      right: "auto",
      bottom: "auto",
    });
  };

  try {
    const saved = JSON.parse(localStorage.getItem(POSITION_KEY) ?? "null");
    if (saved) {
      moveTo(saved.left, saved.top);
    }
  } catch {
    // 隐私模式等拿不到 localStorage，就用默认位置
  }

  let start: { x: number; y: number; left: number; top: number } | null = null;
  let dragging = false;
  canvas.style.touchAction = "none"; // 手机上拖她的时候页面不跟着滚
  canvas.style.cursor = "grab";

  const onDown = (e: PointerEvent) => {
    const rect = container.getBoundingClientRect();
    start = { x: e.clientX, y: e.clientY, left: rect.left, top: rect.top };
    dragging = false;
  };
  const onMove = (e: PointerEvent) => {
    if (!start) {
      return;
    }
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    // 移动超过 5px 才算拖动，轻点、鼠标悬停出菜单都不受影响
    if (!dragging && Math.hypot(dx, dy) < 5) {
      return;
    }
    if (!dragging) {
      dragging = true;
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = "grabbing";
    }
    moveTo(start.left + dx, start.top + dy);
  };
  const onUp = () => {
    if (dragging) {
      canvas.style.cursor = "grab";
      const rect = container.getBoundingClientRect();
      try {
        localStorage.setItem(POSITION_KEY, JSON.stringify({ left: rect.left, top: rect.top }));
      } catch {
        // 存不了就算了，只是刷新后回到默认位置
      }
    }
    start = null;
    dragging = false;
  };
  // 窗口变小时把她拉回屏幕里
  const onResize = () => {
    if (container.style.top) {
      const rect = container.getBoundingClientRect();
      moveTo(rect.left, rect.top);
    }
  };

  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);
  window.addEventListener("resize", onResize);
  return () => {
    canvas.removeEventListener("pointerdown", onDown);
    canvas.removeEventListener("pointermove", onMove);
    canvas.removeEventListener("pointerup", onUp);
    canvas.removeEventListener("pointercancel", onUp);
    window.removeEventListener("resize", onResize);
  };
}

const Live2DMascot = () => {
  useEffect(() => {
    let cancelled = false;
    let cleanup = () => {};

    const start = async () => {
      const { createWidget } = await import("l2d-widget");
      if (cancelled) {
        return;
      }
      const isZh = i18n.language === "zh";
      const small = window.innerWidth < 768; // 手机上缩小一半
      // tips 每一轮都从这个数组里取：拿到新的一言就换进去，下一轮显示的就是它
      const messages = [isZh ? "要休息一下吗？" : "Time for a little break?"];

      // l2d-widget 把容器直接挂在 body 上，又不对外暴露：记下创建前的 body 子元素，新出现的那个就是
      const before = new Set(Array.from(document.body.children));
      const widget = createWidget({
        model: {
          path: MODEL_PATH,
          tips: {
            welcomeMessage: isZh ? ["欢迎来玩～", "你来啦！"] : ["Welcome!", "Hi there~"],
            messages,
            duration: 6000,
            interval: TIP_INTERVAL,
            // 一言句子比较长，默认样式不换行会撑出去；max-content 让气泡按文字撑开，
            // 不然手机上被 100px 宽的容器卡住，一个字一行
            style: { whiteSpace: "normal", width: "max-content", maxWidth: small ? "140px" : "220px" },
            // 手机上气泡往右挪一点，她在屏幕最左边时气泡不会被裁掉
            offset: { x: small ? 20 : 0 },
          },
        },
        size: small ? { width: 100, height: 200 } : { width: 200, height: 400 },
        // 拖到屏幕中间以后，默认的滑动退场滑不出视口（只往下滑自身高度的 130%），淡出没这个问题
        transitionType: "fade",
        primaryColor: "rgba(145, 94, 255, 0.9)", // 站点主色 #915EFF
        // 只留「休息」；默认还有个跳去 l2d-widget 仓库的「关于」按钮
        menus: { items: [{ icon: "mdi:bed", label: isZh ? "休息" : "Rest", onClick: (w) => w.sleep() }] },
      });
      const container = Array.from(document.body.children).find(
        (el) => !before.has(el) && el.querySelector("canvas"),
      ) as HTMLElement | undefined;
      const canvas = container?.querySelector("canvas");
      const stopDrag = container && canvas ? makeDraggable(container, canvas) : () => {};

      const refreshTip = async () => {
        if (document.visibilityState !== "visible") {
          return; // 标签页在后台就不去拉了
        }
        const text = await fetchHitokoto();
        if (text) {
          messages.splice(0, messages.length, text);
        }
      };
      void refreshTip();
      const tipTimer = setInterval(refreshTip, TIP_INTERVAL);

      cleanup = () => {
        clearInterval(tipTimer);
        stopDrag();
        void widget.destroy();
      };
    };

    // 和背景动画一样，等首屏忙完再加载：l2d-widget 约 150KB（gzip）+ 模型 478KB，都不是首屏必需的
    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    if ("requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(() => void start(), { timeout: 3000 });
    } else {
      timeoutId = setTimeout(() => void start(), 2000); // Safari 没有 requestIdleCallback
    }

    return () => {
      cancelled = true;
      if (idleId !== undefined) {
        window.cancelIdleCallback(idleId);
      }
      clearTimeout(timeoutId);
      cleanup();
    };
  }, []);

  return null;
};

export default Live2DMascot;
