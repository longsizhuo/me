// 文案树的读写工具。编辑器要同时改中英文两棵树，而这两棵树的形状可能有细微
// 差异（英文有 i18next 的复数键 photoCount_one / photoCount_other，中文没有），
// 所以一切遍历都按「两棵树的并集」来，不能拿其中一棵当模板 —— 否则只存在于
// 一边的键会在界面上彻底消失，改不了也删不掉。

export type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

export type Path = (string | number)[];

export function getAt(root: unknown, path: Path): unknown {
  let cur: unknown = root;
  for (const seg of path) {
    if (cur === null || typeof cur !== "object") {return undefined;}
    cur = (cur as Record<string | number, unknown>)[seg];
  }
  return cur;
}

/**
 * 返回一棵新树，path 处替换为 value。全程复制、不改原对象 —— React 靠引用
 * 变化判断要不要重渲染，原地改会让界面停在旧值上。
 * path 为空表示替换整棵树。
 */
export function setAt<T>(root: T, path: Path, value: unknown): T {
  if (path.length === 0) {return value as T;}
  const [head, ...rest] = path;
  if (Array.isArray(root)) {
    const copy = root.slice();
    copy[head as number] = setAt(copy[head as number], rest, value);
    return copy as unknown as T;
  }
  const obj = (root ?? {}) as Record<string, unknown>;
  return { ...obj, [head]: setAt(obj[head as string], rest, value) } as T;
}

/** 删除 path 指向的项：数组按下标 splice，对象按键删除。 */
export function removeAt<T>(root: T, path: Path): T {
  if (path.length === 0) {return root;}
  const parentPath = path.slice(0, -1);
  const last = path[path.length - 1];
  const parent = getAt(root, parentPath);
  if (Array.isArray(parent)) {
    const copy = parent.slice();
    copy.splice(last as number, 1);
    return setAt(root, parentPath, copy);
  }
  if (parent && typeof parent === "object") {
    const copy = { ...(parent as Record<string, unknown>) };
    delete copy[last as string];
    return setAt(root, parentPath, copy);
  }
  return root;
}

/** 数组项换位。越界时原样返回，调用方不必自己判边界。 */
export function moveAt<T>(root: T, arrayPath: Path, from: number, to: number): T {
  const arr = getAt(root, arrayPath);
  if (!Array.isArray(arr) || to < 0 || to >= arr.length) {return root;}
  const copy = arr.slice();
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return setAt(root, arrayPath, copy);
}

/**
 * 两个对象的键的并集，保持稳定顺序：先按 a 里出现的顺序，再补上只有 b 有的。
 * 用 Object.keys(a).concat(Object.keys(b)) 去重就够了，不排序 —— 按字母排会
 * 把 JSON 里精心安排的字段顺序（title 在 subtitle 后面之类）打乱。
 */
export function unionKeys(a: unknown, b: unknown): string[] {
  const ka = a && typeof a === "object" && !Array.isArray(a) ? Object.keys(a) : [];
  const kb = b && typeof b === "object" && !Array.isArray(b) ? Object.keys(b) : [];
  return [...new Set([...ka, ...kb])];
}

/** 两个数组里较长的那个的长度。中英文条目数理应相同，不同时以多的为准，好让用户看见并修掉。 */
export function unionLength(a: unknown, b: unknown): number {
  return Math.max(Array.isArray(a) ? a.length : 0, Array.isArray(b) ? b.length : 0);
}

/**
 * 依样造一个空白项，给数组的「新增」用。
 * 拿现有项做模板而不是塞一个空对象：条目的字段名（id/title/company/date…）
 * 只有现有数据知道，新增一个空对象会让用户对着一个没有任何字段的框发呆。
 */
export function blankLike(sample: unknown): Json {
  if (Array.isArray(sample)) {return [];}
  if (sample && typeof sample === "object") {
    const out: Record<string, Json> = {};
    for (const [k, v] of Object.entries(sample as Record<string, unknown>)) {
      out[k] = blankLike(v);
    }
    return out;
  }
  if (typeof sample === "number") {return 0;}
  if (typeof sample === "boolean") {return false;}
  return "";
}

/** 看着像图片地址就给个预览。只认 http(s)，避免把普通文案当成链接。 */
export function looksLikeImage(v: unknown): v is string {
  return (
    typeof v === "string" &&
    /^https?:\/\//.test(v) &&
    /\.(png|jpe?g|webp|avif|gif|svg)(\?|$)/i.test(v)
  );
}
