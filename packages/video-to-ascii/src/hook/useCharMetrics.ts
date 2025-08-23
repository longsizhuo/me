// hooks/useCharMetrics.ts
import { useEffect, useState } from 'react';

export function useCharMetrics() {
  // wPerFs/hPerFs: 每 1px 字号对应的字符宽/高（px）
  const [metrics, setMetrics] = useState({ wPerFs: 0.6, hPerFs: 1 });

  useEffect(() => {
    const pre = document.createElement('pre');
    pre.style.position = 'absolute';
    pre.style.visibility = 'hidden';
    pre.style.fontFamily =
      `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono'`;
    pre.style.lineHeight = '1';
    pre.style.letterSpacing = '0';
    pre.textContent = 'M';
    document.body.appendChild(pre);

    const measure = (fs: number) => {
      pre.style.fontSize = fs + 'px';
      const r = pre.getBoundingClientRect();
      return { wPerFs: r.width / fs, hPerFs: r.height / fs };
    };

    const a = measure(12);
    const b = measure(24);
    document.body.removeChild(pre);

    setMetrics({
      wPerFs: (a.wPerFs + b.wPerFs) / 2,
      hPerFs: (a.hPerFs + b.hPerFs) / 2,
    });
  }, []);

  return metrics;
}
