import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import i18n from "../i18n";
import { cdnUrl } from "../content";

// 看板娘初音，从老博客 longsizhuo.github.io 搬过来：同一个 Live2D Cubism 2 模型，
// 贴图从 2048 的 PNG 压成 1024 的 WebP，整个模型 976KB → 478KB，放在 R2（cdn.longsizhuo.com/live2d/miku/）。
// 显示用 l2d-widget（还在维护的 MIT 库；博客上用的 live2d-widget 已经停止维护）。
// 眼睛和头跟着鼠标转是 l2d 自带的；点她会做动作、说话，是下面加的。
const MODEL_PATH = cdnUrl("live2d/miku/miku.model.json");
const POSITION_KEY = "live2d-position"; // 拖到哪里，刷新后还在哪里
const HITOKOTO_API = "https://v1.hitokoto.cn/?encode=json";
const TIP_INTERVAL = 16000; // 多久说一句「一言」
const BUBBLE_DURATION = 6000; // 每句话显示多久

// 模型里 "null" 这组有 7 个动作：前 6 个是普通的小动作，第 7 个（shake）是摇头
const MOTION_GROUP = "null";
const NORMAL_MOTIONS = 6;
const SHAKE_MOTION = 6;
// 2 秒内连点 4 下算「戳个不停」
const RAPID_CLICKS = 4;
const RAPID_WINDOW = 2000;

const LINES = {
  welcome: { zh: ["欢迎来玩～", "你来啦！"], en: ["Welcome!", "Hi there~"] },
  click: {
    zh: ["嗯？叫我吗？", "今天也要加油哦～", "要不要去相册看看？", "我在听歌呢♪", "戳我干嘛～", "记得多喝水！"],
    en: ["Hm? You called?", "You've got this today!", "Seen the photo album yet?", "I'm listening to music ♪", "Hehe, that tickles~", "Stay hydrated!"],
  },
  poked: { zh: ["再戳我就要生气了！", "别戳啦别戳啦！"], en: ["Hey, stop poking me!", "Okay, okay, I'm awake!"] },
};

function pick(lines: { zh: string[]; en: string[] }) {
  const list = i18n.language === "zh" ? lines.zh : lines.en;
  return list[Math.floor(Math.random() * list.length)];
}

async function fetchHitokoto(): Promise<string | null> {
  try {
    const res = await fetch(HITOKOTO_API);
    const data = await res.json();
    return data.from ? `${data.hitokoto} ——${data.from}` : data.hitokoto;
  } catch {
    return null; // 一言接口挂了这一轮就不说了
  }
}

/**
 * 让看板娘能被拖动。l2d-widget 0.1.2 还没有拖动功能：已经给上游提了 PR 加 draggable 选项
 * （https://github.com/hacxy/l2d-widget/pull/103），发版后这段可以删掉，
 * 改成 createWidget({ draggable: { storageKey: POSITION_KEY } })，transitionType 也可以改回默认的滑动。
 */
function makeDraggable(container: HTMLElement, canvas: HTMLCanvasElement, onTap: () => void) {
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

  let start: { x: number; y: number; left: number; top: number; time: number } | null = null;
  let dragging = false;
  canvas.style.touchAction = "none"; // 手机上拖她的时候页面不跟着滚
  canvas.style.cursor = "grab";

  const onDown = (e: PointerEvent) => {
    const rect = container.getBoundingClientRect();
    start = { x: e.clientX, y: e.clientY, left: rect.left, top: rect.top, time: Date.now() };
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
    // 没怎么动就松开、按的时间也不长，算是点了她一下。
    // 不用 click 事件：手机上 Live2D 框架在触摸事件里 preventDefault，浏览器不会再补发 click
    if (start && !dragging && Date.now() - start.time < 500) {
      onTap();
    }
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

/** 头顶的对话气泡。用自己的而不是 l2d-widget 自带的：自带的只能按固定间隔轮播，点她时没法立刻说话 */
const Bubble = ({ text, small }: { text: string; small: boolean }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [shift, setShift] = useState(0);

  // 她在屏幕边上时，居中的气泡会被裁掉一截：量一下，超出屏幕就往回挪（小三角仍然指着她）
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    const rect = el.getBoundingClientRect();
    const left = rect.left - shift;
    const right = rect.right - shift;
    const margin = 8;
    if (left < margin) {
      setShift(margin - left);
    } else if (right > window.innerWidth - margin) {
      setShift(window.innerWidth - margin - right);
    } else {
      setShift(0);
    }
    // 只在换了一句话时重新量
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return (
    <div
      className="absolute left-1/2 pointer-events-none"
      style={{ bottom: "calc(100% + 10px)", transform: `translateX(calc(-50% + ${shift}px))` }}
    >
      <div
        ref={ref}
        className="relative w-max rounded-lg px-3.5 py-2 text-center text-[13px] leading-normal text-white/95"
        style={{ background: "rgba(145, 94, 255, 0.9)", maxWidth: small ? 160 : 220 }}
      >
        {text}
        {/* 底下的小三角：气泡挪了多少，它就反着挪回去，始终指着她 */}
        <div
          className="absolute -bottom-[7px] w-0 h-0"
          style={{
            left: `calc(50% - 6px - ${shift}px)`,
            borderLeft: "6px solid transparent",
            borderRight: "6px solid transparent",
            borderTop: "7px solid rgba(145, 94, 255, 0.9)",
          }}
        />
      </div>
    </div>
  );
};

const Live2DMascot = () => {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [bubble, setBubble] = useState<string | null>(null);
  const [small] = useState(() => typeof window !== "undefined" && window.innerWidth < 768); // 手机上缩小一半
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const bubbleUntil = useRef(0); // 当前这句话显示到什么时候

  useEffect(() => {
    let cancelled = false;
    let cleanup = () => {};

    const say = (text: string) => {
      setBubble(text);
      bubbleUntil.current = Date.now() + BUBBLE_DURATION;
      clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setBubble(null), BUBBLE_DURATION);
    };

    const start = async () => {
      const { createWidget } = await import("l2d-widget");
      if (cancelled) {
        return;
      }
      // l2d-widget 把容器直接挂在 body 上，又不对外暴露：记下创建前的 body 子元素，新出现的那个就是
      const before = new Set(Array.from(document.body.children));
      const widget = createWidget({
        model: { path: MODEL_PATH, tips: false },
        size: small ? { width: 100, height: 200 } : { width: 200, height: 400 },
        // 拖到屏幕中间以后，默认的滑动退场滑不出视口（只往下滑自身高度的 130%），淡出没这个问题
        transitionType: "fade",
        primaryColor: "rgba(145, 94, 255, 0.9)", // 站点主色 #915EFF
        // 只留「休息」；默认还有个跳去 l2d-widget 仓库的「关于」按钮
        menus: {
          items: [{ icon: "mdi:bed", label: i18n.language === "zh" ? "休息" : "Rest", onClick: (w) => w.sleep() }],
        },
      });
      const box = Array.from(document.body.children).find(
        (el) => !before.has(el) && el.querySelector("canvas"),
      ) as HTMLElement | undefined;
      const canvas = box?.querySelector("canvas");
      if (!box || !canvas) {
        cleanup = () => void widget.destroy();
        return;
      }
      setContainer(box);

      // 点她：做个小动作、说句话；2 秒内连点 4 下就摇头抗议
      let clicks: number[] = [];
      const onTap = () => {
        const now = Date.now();
        clicks = [...clicks.filter((t) => now - t < RAPID_WINDOW), now];
        if (clicks.length >= RAPID_CLICKS) {
          clicks = [];
          widget.l2d.playMotion(MOTION_GROUP, SHAKE_MOTION, 3); // 3 = 强制打断当前动作
          say(pick(LINES.poked));
        } else {
          widget.l2d.playMotion(MOTION_GROUP, Math.floor(Math.random() * NORMAL_MOTIONS), 3);
          say(pick(LINES.click));
        }
      };
      const stopDrag = makeDraggable(box, canvas, onTap);

      // 模型加载完、淡入之后打个招呼
      widget.l2d.on("loaded", () => {
        setTimeout(() => say(pick(LINES.welcome)), 1500);
      });

      // 每隔一会儿说一句一言；正在说别的话、或者标签页在后台时跳过这一轮
      const tipTimer = setInterval(async () => {
        if (document.visibilityState !== "visible" || Date.now() < bubbleUntil.current) {
          return;
        }
        const text = await fetchHitokoto();
        if (text) {
          say(text);
        }
      }, TIP_INTERVAL);

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
      clearTimeout(hideTimer.current);
      cleanup();
    };
  }, [small]);

  return container && bubble ? createPortal(<Bubble text={bubble} small={small} />, container) : null;
};

export default Live2DMascot;
