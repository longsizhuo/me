// 计算与处理相关的纯函数与服务

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// 过滤非 ASCII 字符，并去重保序
export function sanitizeAscii(input: string): string {
  const uniqueCharacters: string[] = [];
  const seenCharacters = new Set<string>();
  for (const ch of input) {
    const code = ch.charCodeAt(0);
    if (code >= 32 && code <= 126 && !seenCharacters.has(ch)) {
      seenCharacters.add(ch);
      uniqueCharacters.push(ch);
    }
  }
  return uniqueCharacters.join("");
}

// 将一帧图像数据转换为 ASCII 行数组
export function imageToAscii(
  imageData: Uint8ClampedArray,
  width: number,
  height: number,
  characters: string
): string[] {
  const asciiRows: string[] = [];
  const WHITE_CLAMP = 0.97; // 高亮钳制阈值（0~1）

  for (let y = 0; y < height; y++) {
    let line = "";
    const rowOffset = y * width * 4;

    for (let x = 0; x < width; x++) {
      const pixelIndex = rowOffset + x * 4;
      const r = imageData[pixelIndex];
      const g = imageData[pixelIndex + 1];
      const b = imageData[pixelIndex + 2];

      // 1) 计算亮度（0~255）→ 归一化到 0~1
      const luminance01 = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

      // 2) 高亮端钳制（clamp）
      const clamped = luminance01 > WHITE_CLAMP ? 1.0 : luminance01;

      // 3) 映射到字符索引
      const characterIndex = Math.max(
        0,
        Math.min(
          characters.length - 1,
          Math.floor(clamped * (characters.length - 1))
        )
      );

      line += characters[characterIndex];
    }

    asciiRows.push(line);
  }

  return asciiRows;
}

export interface GenerateFramesOptions {
  rows: number;
  cols: number;
  frameRate: number; // 期望帧率（会在 5~24 之间钳制）
  characters: string;
  gamma?: number; // 预留参数（当前算法未使用）
  emaAlpha?: number; // 预留参数（当前算法未使用）
  hysteresis?: number; // 预留参数（当前算法未使用）
  canvas?: HTMLCanvasElement; // 可复用现有 canvas，避免重复创建
}

// 从视频生成 ASCII 帧序列
export async function generateAsciiFramesFromVideo(
  video: HTMLVideoElement,
  options: GenerateFramesOptions
): Promise<string[][]> {
  const { rows, cols, frameRate, characters, canvas } = options;

  // 使用传入的 canvas 或创建一个离屏 canvas
  const renderCanvas =
    canvas ?? (document.createElement("canvas") as HTMLCanvasElement);
  const context = renderCanvas.getContext("2d", { willReadFrequently: true });
  if (!context) return [];

  renderCanvas.width = cols;
  renderCanvas.height = rows;
  context.imageSmoothingEnabled = false;

  const frames: string[][] = [];
  const stepSeconds = 1 / clamp(frameRate, 5, 24);

  return new Promise<string[][]>((resolve) => {
    const renderOneFrame = () => {
      if (video.currentTime >= video.duration) return resolve(frames);

      context.drawImage(video, 0, 0, cols, rows);
      const image = context.getImageData(0, 0, cols, rows);
      const ascii = imageToAscii(image.data, cols, rows, characters);
      frames.push(ascii);

      video.currentTime += stepSeconds;
      video.addEventListener("seeked", renderOneFrame, { once: true });
    };

    // 从头开始
    video.currentTime = 0;
    video.addEventListener("seeked", renderOneFrame, { once: true });
  });
}
