import { useCallback, useEffect, useState } from "react";
import { fetchContent, saveContent, ApiError, type ContentTree } from "../../api/album";
import { ContentNode } from "./ContentNode";
import { sectionLabel } from "./labels";
import { blankLike, getAt, moveAt, removeAt, setAt, unionKeys, type Path } from "./tree";

type Lang = "zh" | "en";

interface Draft {
  zh: ContentTree;
  en: ContentTree;
  version: number;
}

function toMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export default function ContentEditor() {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [openSection, setOpenSection] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const data = await fetchContent();
      setDraft({ zh: data.zh, en: data.en, version: data.version });
      setDirty(false);
    } catch (err) {
      setLoadError(toMessage(err));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // 关标签页前拦一下。这个表单里可能是半小时的编辑成果，而保存要走一次网络
  // 请求，误关的代价远大于多一次确认框的打扰。
  useEffect(() => {
    if (!dirty) {return;}
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const mutate = useCallback((fn: (d: Draft) => Draft) => {
    setDraft((prev) => (prev ? fn(prev) : prev));
    setDirty(true);
    setNotice(null);
  }, []);

  const onChange = useCallback(
    (lang: Lang, path: Path, value: unknown) => {
      mutate((d) => ({ ...d, [lang]: setAt(d[lang], path, value) }));
    },
    [mutate],
  );

  const onChangeBoth = useCallback(
    (path: Path, value: unknown) => {
      mutate((d) => ({ ...d, zh: setAt(d.zh, path, value), en: setAt(d.en, path, value) }));
    },
    [mutate],
  );

  // 增删和排序一律同时作用在中英文两棵树上。只改一边会让两边条目数对不上，
  // 后端会直接拒绝发布（worker/src/content.ts 的 validate），而用户在界面上
  // 看不出哪里错了。
  const onAdd = useCallback(
    (path: Path) => {
      mutate((d) => {
        const next = { ...d };
        for (const lang of ["zh", "en"] as const) {
          const arr = getAt(d[lang], path);
          if (!Array.isArray(arr)) {continue;}
          // 拿本语言现有项做模板；本语言是空数组时借用另一门语言的，
          // 否则新增出来会是一个没有任何字段的空对象。
          const other = getAt(d[lang === "zh" ? "en" : "zh"], path);
          const sample = arr[0] ?? (Array.isArray(other) ? other[0] : undefined);
          next[lang] = setAt(d[lang], path, [...arr, blankLike(sample ?? "")]);
        }
        return next;
      });
    },
    [mutate],
  );

  const onRemove = useCallback(
    (path: Path) => {
      mutate((d) => ({ ...d, zh: removeAt(d.zh, path), en: removeAt(d.en, path) }));
    },
    [mutate],
  );

  const onMove = useCallback(
    (path: Path, from: number, to: number) => {
      mutate((d) => ({
        ...d,
        zh: moveAt(d.zh, path, from, to),
        en: moveAt(d.en, path, from, to),
      }));
    },
    [mutate],
  );

  const onSave = useCallback(async () => {
    if (!draft) {return;}
    setSaving(true);
    setSaveError(null);
    setNotice(null);
    try {
      const res = await saveContent({ zh: draft.zh, en: draft.en, baseVersion: draft.version });
      setDraft((prev) => (prev ? { ...prev, version: res.version } : prev));
      setDirty(false);
      setNotice(`已保存（v${res.version}）。服务器每 30 秒检查一次，稍后会自动重新构建上线。`);
    } catch (err) {
      // 409 是并发冲突，不是网络错误，得让用户知道刷新会丢掉当前编辑。
      const conflict = err instanceof ApiError && err.status === 409;
      setSaveError(conflict ? `${toMessage(err)}（刷新会丢失当前未保存的修改）` : toMessage(err));
    } finally {
      setSaving(false);
    }
  }, [draft]);

  if (loadError) {
    return (
      <div className="text-secondary">
        <p>读取文案失败：{loadError}</p>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-3 px-4 py-2 rounded-lg bg-tertiary text-white"
        >
          重试
        </button>
      </div>
    );
  }

  if (!draft) {return <p className="text-secondary">加载中…</p>;}

  const sections = unionKeys(draft.zh, draft.en);

  return (
    <div>
      <div className="sticky top-0 z-10 bg-primary/95 backdrop-blur py-3 flex flex-wrap items-center gap-3 border-b border-white/10">
        <button
          type="button"
          onClick={() => void onSave()}
          disabled={saving || !dirty}
          className="px-4 py-2 rounded-lg bg-white text-primary font-semibold disabled:opacity-40"
        >
          {saving ? "保存中…" : "保存"}
        </button>
        <button
          type="button"
          onClick={() => void load()}
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-tertiary text-white disabled:opacity-40"
        >
          放弃修改并重新加载
        </button>
        <span className="text-secondary text-[13px]">
          v{draft.version}
          {dirty && <span className="text-yellow-400"> · 有未保存的修改</span>}
        </span>
      </div>

      {notice && <p className="mt-3 text-[13px] text-green-400">{notice}</p>}
      {saveError && <p className="mt-3 text-[13px] text-red-400">保存失败：{saveError}</p>}

      <p className="mt-4 text-secondary text-[13px] leading-6">
        中英文并排编辑。列表的新增、删除、排序会同时作用于两种语言 —— 两边条目数不一致时服务器会拒绝发布。
        保存只是写入数据库，页面重新构建上线约需 30 秒。
      </p>

      {sections.map((key) => {
        const open = openSection === key;
        return (
          <div key={key} className="mt-3 border border-white/10 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenSection(open ? null : key)}
              className="w-full text-left px-4 py-3 bg-tertiary text-white font-semibold flex justify-between items-center"
            >
              <span>{sectionLabel(key)}</span>
              <span className="text-secondary text-[12px]">{open ? "收起" : "展开"}</span>
            </button>
            {/* 一次只展开一节：13 个区块全铺开是几百个输入框，滚动和渲染都难受 */}
            {open && (
              <div className="px-4 pb-4">
                <ContentNode
                  zhRoot={draft.zh}
                  enRoot={draft.en}
                  path={[key]}
                  label=""
                  depth={1}
                  onChange={onChange}
                  onChangeBoth={onChangeBoth}
                  onAdd={onAdd}
                  onRemove={onRemove}
                  onMove={onMove}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
