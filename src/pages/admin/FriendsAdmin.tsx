import { useCallback, useEffect, useState } from "react";
import {
  createFriend,
  deleteFriend,
  fetchAdminFriends,
  updateFriend,
  type Friend,
} from "../../api/friends";

function toMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

interface FormState {
  name: string;
  url: string;
  img: string;
  description: string;
}

const EMPTY: FormState = { name: "", url: "", img: "", description: "" };

export default function FriendsAdmin() {
  const [list, setList] = useState<Friend[] | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      setList(await fetchAdminFriends());
    } catch (err) {
      setLoadError(toMessage(err));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const setField = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setActionError(null);
  };

  const startEdit = (f: Friend) => {
    setEditingId(f.id);
    setForm({ name: f.name, url: f.url, img: f.img, description: f.description });
    setActionError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY);
    setActionError(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.url.trim()) {
      setActionError("name 和 url 必填");
      return;
    }
    setBusy(true);
    setActionError(null);
    try {
      if (editingId === null) {
        await createFriend(form);
      } else {
        await updateFriend(editingId, form);
      }
      cancelEdit();
      await load();
    } catch (err) {
      setActionError(toMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (f: Friend) => {
    if (!window.confirm(`确认删除友链「${f.name}」？`)) {
      return;
    }
    setBusy(true);
    setActionError(null);
    try {
      await deleteFriend(f.id);
      await load();
    } catch (err) {
      setActionError(toMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const inputCls =
    "bg-black-100 border border-white/10 rounded-lg px-3 py-2 text-[14px] text-white placeholder:text-white/30 focus:outline-none focus:border-[#915EFF] w-full";

  return (
    <div className="space-y-6">
      <p className="text-secondary text-[14px] leading-6">
        友链存在 Worker 的 D1 里，主页 Friends 区块通过 /api/friends 渲染（
        内置一份兜底，API 挂了也不会空白）。改动即时生效，无需重新部署。
      </p>

      {loadError && (
        <p className="text-red-400 text-[14px]">加载失败：{loadError}</p>
      )}
      {actionError && (
        <p className="text-red-400 text-[14px]">操作失败：{actionError}</p>
      )}

      <form onSubmit={submit} className="bg-tertiary rounded-2xl p-5 space-y-4">
        <h3 className="text-white font-semibold text-[15px]">
          {editingId === null ? "新增友链" : "编辑友链"}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-secondary text-[13px]">名称 *</label>
            <input
              className={inputCls}
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="站点名"
            />
          </div>
          <div className="space-y-1">
            <label className="text-secondary text-[13px]">URL *</label>
            <input
              className={inputCls}
              value={form.url}
              onChange={(e) => setField("url", e.target.value)}
              placeholder="https://example.com"
            />
          </div>
          <div className="space-y-1">
            <label className="text-secondary text-[13px]">头像 URL</label>
            <input
              className={inputCls}
              value={form.img}
              onChange={(e) => setField("img", e.target.value)}
              placeholder="https://example.com/avatar.png"
            />
          </div>
          <div className="space-y-1">
            <label className="text-secondary text-[13px]">一句话描述</label>
            <input
              className={inputCls}
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="描述一下这个站点"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={busy}
            className="px-4 py-2 rounded-lg bg-white text-primary text-[14px] font-semibold disabled:opacity-50"
          >
            {editingId === null ? "添加" : "保存修改"}
          </button>
          {editingId !== null && (
            <button
              type="button"
              onClick={cancelEdit}
              className="px-4 py-2 rounded-lg bg-white/10 text-white text-[14px] hover:bg-white/20"
            >
              取消
            </button>
          )}
        </div>
      </form>

      <div className="space-y-3">
        {list === null ? (
          <p className="text-secondary text-[14px]">加载中…</p>
        ) : list.length === 0 ? (
          <p className="text-secondary text-[14px]">还没有友链，用上面的表单添加一条。</p>
        ) : (
          list.map((f) => (
            <div
              key={f.id}
              className="bg-tertiary rounded-2xl p-4 flex items-center gap-4"
            >
              <img
                src={f.img}
                alt={f.name}
                loading="lazy"
                className="w-12 h-12 rounded-full object-cover shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://github.com/longsizhuo.png";
                }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-white font-semibold text-[15px]">{f.name}</h4>
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#915EFF] text-[13px] hover:underline truncate"
                  >
                    {f.url}
                  </a>
                </div>
                <p className="mt-1 text-secondary text-[13px] truncate">
                  {f.description || "—"}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => startEdit(f)}
                  disabled={busy}
                  className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-[13px] hover:bg-white/20 disabled:opacity-50"
                >
                  编辑
                </button>
                <button
                  type="button"
                  onClick={() => remove(f)}
                  disabled={busy}
                  className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 text-[13px] hover:bg-red-500/30 disabled:opacity-50"
                >
                  删除
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
