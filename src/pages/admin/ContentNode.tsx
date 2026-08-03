// 文案树的递归编辑器。一个节点一个组件，按值的类型决定渲染成分组、列表还是
// 输入框。中英文并排编辑而不是分两个标签页切换 —— 数组的增删和排序必须同时
// 作用在两棵树上，分开编辑迟早会让两边条目数对不上，而那正好是后端拒绝发布
// 的条件（见 worker/src/content.ts 的 validate）。
import { useState } from "react";
import type { Path } from "./tree";
import { getAt, isImageField, looksLikeImage, unionKeys, unionLength } from "./tree";
import { uploadAsset } from "../../api/album";
import { sectionLabel } from "./labels";

// 这个页面是只有站主自己能进的工具（Cloudflare Access 挡着），和 AlbumAdmin
// 一样刻意不走站点的 i18n —— 界面文字直接写中文。

export interface NodeHandlers {
  onChange: (lang: "zh" | "en", path: Path, value: unknown) => void;
  /** 同时写进中英文两棵树。图片地址这类不需要翻译的值用它。 */
  onChangeBoth: (path: Path, value: unknown) => void;
  onAdd: (path: Path) => void;
  onRemove: (path: Path) => void;
  onMove: (path: Path, from: number, to: number) => void;
}

interface Props extends NodeHandlers {
  zhRoot: unknown;
  enRoot: unknown;
  path: Path;
  label: string;
  depth: number;
}

const INPUT_CLASS =
  "w-full rounded-lg bg-tertiary text-white-100 text-[14px] px-3 py-2 border border-white/10 focus:border-white/40 focus:outline-none";

function LeafInput({
  lang,
  value,
  path,
  onChange,
}: {
  lang: "zh" | "en";
  value: unknown;
  path: Path;
  onChange: NodeHandlers["onChange"];
}) {
  const langLabel = lang === "zh" ? "中文" : "English";

  if (value === undefined) {
    // 只存在于一门语言的键是合法的（英文的 i18next 复数形式就是这样），
    // 所以这里不报错，只给一个显式的补写入口。
    return (
      <div className="flex-1">
        <div className="text-secondary text-[11px] mb-1">{langLabel}</div>
        <button
          type="button"
          onClick={() => onChange(lang, path, "")}
          className="text-[12px] text-secondary hover:text-white underline decoration-dotted"
        >
          此语言暂无该字段，点击添加
        </button>
      </div>
    );
  }

  if (typeof value === "boolean") {
    return (
      <label className="flex-1 flex items-center gap-2 text-[13px] text-white-100">
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(lang, path, e.target.checked)}
        />
        {langLabel}
      </label>
    );
  }

  if (typeof value === "number") {
    return (
      <div className="flex-1">
        <div className="text-secondary text-[11px] mb-1">{langLabel}</div>
        <input
          type="number"
          className={INPUT_CLASS}
          value={value}
          onChange={(e) => onChange(lang, path, Number(e.target.value))}
        />
      </div>
    );
  }

  const text = typeof value === "string" ? value : JSON.stringify(value);
  const multiline = text.length > 60 || text.includes("\n");

  return (
    <div className="flex-1 min-w-0">
      <div className="text-secondary text-[11px] mb-1">{langLabel}</div>
      {multiline ? (
        <textarea
          className={`${INPUT_CLASS} min-h-[76px] resize-y`}
          value={text}
          onChange={(e) => onChange(lang, path, e.target.value)}
        />
      ) : (
        <input className={INPUT_CLASS} value={text} onChange={(e) => onChange(lang, path, e.target.value)} />
      )}
      {looksLikeImage(text) && (
        <img
          src={text}
          alt=""
          className="mt-2 h-12 w-12 rounded object-contain bg-black-200 p-1"
          // 填错地址是常事，坏图标不该在编辑器里留一个碎图占位。
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
          onLoad={(e) => {
            e.currentTarget.style.display = "";
          }}
        />
      )}
    </div>
  );
}

function ImageUpload({
  path,
  onUploaded,
}: {
  path: Path;
  onUploaded: NodeHandlers["onChangeBoth"];
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="mt-2 flex items-center gap-3 flex-wrap">
      <label
        className={`px-3 py-1.5 text-[12px] rounded-lg cursor-pointer ${
          busy ? "bg-tertiary text-secondary" : "bg-tertiary text-white hover:bg-white/10"
        }`}
      >
        {busy ? "上传中…" : "上传图片"}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          disabled={busy}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            // 先把 input 清空，否则连着选同一个文件第二次不会触发 change。
            e.target.value = "";
            if (!file) {return;}
            setBusy(true);
            setError(null);
            try {
              const { url } = await uploadAsset(file);
              onUploaded(path, url);
            } catch (err) {
              setError(err instanceof Error ? err.message : String(err));
            } finally {
              setBusy(false);
            }
          }}
        />
      </label>
      <span className="text-secondary text-[11px]">上传后自动填入中英文两栏</span>
      {error && <span className="text-red-400 text-[11px]">{error}</span>}
    </div>
  );
}

export function ContentNode(props: Props) {
  const { zhRoot, enRoot, path, label, depth, onChange, onChangeBoth, onAdd, onRemove, onMove } =
    props;
  const zv = getAt(zhRoot, path);
  const ev = getAt(enRoot, path);
  const ref = zv !== undefined ? zv : ev;

  if (Array.isArray(ref)) {
    const len = unionLength(zv, ev);
    return (
      <fieldset className="border border-white/10 rounded-xl p-3 mt-3">
        <legend className="px-2 text-[13px] text-white font-semibold">
          {label} <span className="text-secondary font-normal">（{len} 项）</span>
        </legend>
        {Array.from({ length: len }).map((_, i) => (
          <div key={i} className="border border-white/5 rounded-lg p-3 mt-2 bg-black-200/40">
            <div className="flex items-center justify-between">
              <span className="text-secondary text-[12px]">第 {i + 1} 项</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={i === 0}
                  onClick={() => onMove(path, i, i - 1)}
                  className="px-2 py-1 text-[12px] rounded bg-tertiary text-white-100 disabled:opacity-30"
                >
                  上移
                </button>
                <button
                  type="button"
                  disabled={i === len - 1}
                  onClick={() => onMove(path, i, i + 1)}
                  className="px-2 py-1 text-[12px] rounded bg-tertiary text-white-100 disabled:opacity-30"
                >
                  下移
                </button>
                <button
                  type="button"
                  onClick={() => onRemove([...path, i])}
                  className="px-2 py-1 text-[12px] rounded bg-red-900/60 text-white-100"
                >
                  删除
                </button>
              </div>
            </div>
            <ContentNode {...props} path={[...path, i]} label="" depth={depth + 1} />
          </div>
        ))}
        <button
          type="button"
          onClick={() => onAdd(path)}
          className="mt-3 px-3 py-1.5 text-[13px] rounded-lg bg-tertiary text-white hover:bg-white/10"
        >
          + 新增一项
        </button>
      </fieldset>
    );
  }

  if (ref !== null && typeof ref === "object") {
    const keys = unionKeys(zv, ev);
    const Wrapper = depth === 0 ? "section" : "div";
    return (
      <Wrapper className={depth === 0 ? "" : "mt-2"}>
        {label && depth > 0 && (
          <div className="text-white text-[13px] font-semibold mt-3">{label}</div>
        )}
        {keys.map((k) => (
          <ContentNode
            {...props}
            key={k}
            path={[...path, k]}
            label={depth === 0 ? sectionLabel(k) : k}
            depth={depth + 1}
          />
        ))}
      </Wrapper>
    );
  }

  // 叶子：中英文并排
  return (
    <div className="mt-3">
      {label && <div className="text-white-100 text-[13px] mb-1">{label}</div>}
      <div className="flex gap-3 flex-col sm:flex-row">
        <LeafInput lang="zh" value={zv} path={path} onChange={onChange} />
        <LeafInput lang="en" value={ev} path={path} onChange={onChange} />
      </div>
      {/* 上传按钮只出现一次、同时写进中英文：图片地址不是需要翻译的东西，
          分成两个按钮迟早会出现中文版换了 logo、英文版还是旧的。 */}
      {isImageField(path, zv ?? ev) && <ImageUpload path={path} onUploaded={onChangeBoth} />}
    </div>
  );
}
