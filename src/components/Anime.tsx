// React + Vite 中 preload ascii
import { useEffect, useState } from 'react';

export default function AsciiPlayer() {
  const [frames, setFrames] = useState<string[]>([]);
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    const total = 100; // 假设有100帧
    Promise.all(
      Array.from({ length: total }, (_, i) =>
        fetch(`/ascii_frames/frame_${String(i + 1).padStart(4, '0')}.txt`).then(res => res.text())
      )
    ).then(setFrames);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setFrameIndex(i => (i + 1) % frames.length);
    }, 100); // 10fps
    return () => clearInterval(id);
  }, [frames]);

  return (
    <pre style={{ fontFamily: 'monospace', fontSize: '8px', lineHeight: '8px' }}>
      {frames[frameIndex]}
    </pre>
  );
}
