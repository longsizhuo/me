import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { styles } from "../styles";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { imageUrl } from "../content/images";
import {
  createAlbum,
  deletePhoto,
  fetchAlbum,
  fetchAlbums,
  fetchPhotos,
  setAlbumCover,
  updatePhotoSortOrder,
  uploadPhotos,
  type AlbumSummary,
  type Photo,
  type UploadResult,
} from "../api/album";

// ponytail: this page is an owner-only tool behind Cloudflare Access, not
// public content — it intentionally skips the site's i18n system (unlike
// the homepage strip in Task 7, which the task explicitly requires to stay
// bilingual). Add translations if the admin UI ever needs to be read by
// someone other than the site owner.

const SLUG_PATTERN = /^[a-z0-9-]+$/;

interface UploadRow {
  file: File;
  status: "reading" | "uploading" | "done" | "error";
  w?: number;
  h?: number;
  error?: string;
}

function toMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/**
 * Reads a file's pixel dimensions in the browser via createImageBitmap —
 * the Worker has no image library and rejects an upload whose widths/heights
 * arrays don't have one entry per file, so this must happen client-side
 * before the request is ever sent.
 */
async function readDimensions(file: File): Promise<{ w: number; h: number }> {
  const bitmap = await createImageBitmap(file);
  const dims = { w: bitmap.width, h: bitmap.height };
  bitmap.close();
  return dims;
}

function PhotoRow({
  photo,
  index,
  isCover,
  onDelete,
  onSetCover,
  onSaveSort,
}: {
  photo: Photo;
  index: number;
  isCover: boolean;
  onDelete: (id: number) => Promise<void>;
  onSetCover: (key: string) => Promise<void>;
  onSaveSort: (id: number, value: number) => Promise<void>;
}) {
  // ponytail: the public read API (worker/src/albums.ts's foldPhoto) never
  // exposes sort_order, and there is no admin GET-list endpoint either — Task
  // 8's file list only covers this page + App.tsx, not the Worker. Display
  // position is used as the input's starting value; it's a reasonable stand-in
  // for "current order" since the public API already returns photos ordered
  // by sort_order, but it is NOT the literal stored integer. Add a Worker
  // admin list endpoint that returns sort_order if this ever needs to be exact.
  const [sortValue, setSortValue] = useState(index);
  const [busy, setBusy] = useState(false);

  // key 是 photo.id，所以删除或重排后组件实例被复用、不会重新挂载，
  // useState(index) 的初始值就此定格在旧位置。不同步的话，管理员看到的
  // 是过期下标，照它点 Save order 会把错误的 sort_order 写进库，而且
  // 界面上看不出来。index 变了就跟上。
  useEffect(() => {
    setSortValue(index);
  }, [index]);

  return (
    <div className="flex flex-wrap items-center gap-3 bg-tertiary rounded-xl p-3">
      <div className="w-16 h-16 rounded-lg overflow-hidden bg-black-100/60 shrink-0">
        <img
          src={imageUrl(photo.key, { width: 160, height: 160, fit: "cover" })}
          alt=""
          className="w-full h-full object-cover"
          onError={(e) => {
            // Same convention as Album.tsx/AlbumList.tsx/AlbumDetail.tsx: hide
            // the broken <img> instead of ever falling back to the raw R2 key.
            e.currentTarget.style.display = "none";
          }}
        />
      </div>
      <div className="flex-1 min-w-[160px]">
        <p className="text-white text-[13px] break-all">{photo.key}</p>
        <p className="text-secondary text-[12px]">
          {photo.w}×{photo.h}
          {isCover ? " · cover" : ""}
        </p>
      </div>
      <label className="flex items-center gap-2 text-secondary text-[12px]">
        sort
        <input
          type="number"
          value={sortValue}
          onChange={(e) => setSortValue(Number(e.target.value))}
          className="w-16 bg-black-100 text-white rounded-sm px-2 py-1 outline-hidden"
          disabled={busy}
        />
      </label>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await onSaveSort(photo.id, sortValue);
          } finally {
            setBusy(false);
          }
        }}
        className="text-[12px] px-3 py-1.5 rounded-lg bg-black-100 text-white hover:bg-black-100/70 disabled:opacity-50"
      >
        Save order
      </button>
      <button
        type="button"
        disabled={busy || isCover}
        onClick={async () => {
          setBusy(true);
          try {
            await onSetCover(photo.key);
          } finally {
            setBusy(false);
          }
        }}
        className="text-[12px] px-3 py-1.5 rounded-lg bg-black-100 text-white hover:bg-black-100/70 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isCover ? "Cover" : "Set cover"}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          if (!window.confirm(`Delete ${photo.key}? This removes it from R2 and D1.`)) {
            return;
          }
          setBusy(true);
          try {
            await onDelete(photo.id);
          } finally {
            setBusy(false);
          }
        }}
        className="text-[12px] px-3 py-1.5 rounded-lg bg-red-900/40 text-red-200 hover:bg-red-900/60 disabled:opacity-50"
      >
        Delete
      </button>
    </div>
  );
}

const AlbumAdmin = () => {
  const [albums, setAlbums] = useState<AlbumSummary[] | null>(null);
  const [albumsError, setAlbumsError] = useState<string | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  const [slug, setSlug] = useState("");
  const [nameZh, setNameZh] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [coverKey, setCoverKey] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [photosError, setPhotosError] = useState<string | null>(null);

  const [uploadRows, setUploadRows] = useState<UploadRow[]>([]);

  // Guards against a slow response from album A landing after the admin has
  // already clicked into album B — same idiom as AlbumDetail's activeSlugRef.
  const activeSlugRef = useRef<string | null>(null);

  // 标记「当前这一批上传」。见 handleFiles 里的说明。
  const activeBatchRef = useRef<symbol | null>(null);

  const loadAlbums = useCallback(async () => {
    try {
      // fresh: 绕过 HTTP 缓存。写完立刻用同一个 URL 重拉，命中 max-age=60
      // 的缓存就会读到写之前的状态。
      const data = await fetchAlbums(undefined, { fresh: true });
      setAlbums(data);
      setAlbumsError(null);
    } catch (err) {
      setAlbumsError(toMessage(err));
    }
  }, []);

  useEffect(() => {
    loadAlbums();
  }, [loadAlbums]);

  const loadPhotos = useCallback(async (targetSlug: string) => {
    setPhotosLoading(true);
    setPhotosError(null);
    try {
      const data = await fetchAlbum(targetSlug, { limit: 60, fresh: true });
      if (activeSlugRef.current !== targetSlug) {
        return;
      }
      setPhotos(data.photos);
      setCoverKey(data.coverKey);
      setCursor(data.nextCursor);
    } catch (err) {
      if (activeSlugRef.current !== targetSlug) {
        return;
      }
      setPhotosError(toMessage(err));
    } finally {
      if (activeSlugRef.current === targetSlug) {
        setPhotosLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    activeSlugRef.current = selectedSlug;
    setPhotos([]);
    setCoverKey(null);
    setCursor(null);
    setUploadRows([]);
    setPhotosError(null);
    if (selectedSlug) {
      loadPhotos(selectedSlug);
    }
  }, [selectedSlug, loadPhotos]);

  async function handleCreateAlbum(e: FormEvent) {
    e.preventDefault();
    const trimmedSlug = slug.trim();
    const trimmedZh = nameZh.trim();
    const trimmedEn = nameEn.trim();
    if (!SLUG_PATTERN.test(trimmedSlug)) {
      setCreateError("Slug must be lowercase letters, digits, and hyphens only.");
      return;
    }
    if (!trimmedZh || !trimmedEn) {
      setCreateError("Both the Chinese and English names are required.");
      return;
    }
    setCreateError(null);
    setCreating(true);
    try {
      await createAlbum({ slug: trimmedSlug, nameZh: trimmedZh, nameEn: trimmedEn });
      setSlug("");
      setNameZh("");
      setNameEn("");
      await loadAlbums();
      setSelectedSlug(trimmedSlug);
    } catch (err) {
      setCreateError(toMessage(err));
    } finally {
      setCreating(false);
    }
  }

  async function handleLoadMore() {
    if (!selectedSlug || !cursor) {
      return;
    }
    const targetSlug = selectedSlug;
    try {
      const data = await fetchPhotos(targetSlug, cursor, 60);
      if (activeSlugRef.current !== targetSlug) {
        return;
      }
      setPhotos((prev) => [...prev, ...data.photos]);
      setCursor(data.nextCursor);
    } catch (err) {
      if (activeSlugRef.current === targetSlug) {
        setPhotosError(toMessage(err));
      }
    }
  }

  async function handleSaveSort(id: number, value: number) {
    if (!selectedSlug) {
      return;
    }
    try {
      await updatePhotoSortOrder(id, value);
      await loadPhotos(selectedSlug);
    } catch (err) {
      setPhotosError(toMessage(err));
    }
  }

  async function handleSetCover(key: string) {
    if (!selectedSlug) {
      return;
    }
    try {
      await setAlbumCover(selectedSlug, key);
      await loadPhotos(selectedSlug);
    } catch (err) {
      setPhotosError(toMessage(err));
    }
  }

  async function handleDeletePhoto(id: number) {
    if (!selectedSlug) {
      return;
    }
    try {
      await deletePhoto(id);
      await Promise.all([loadPhotos(selectedSlug), loadAlbums()]);
    } catch (err) {
      setPhotosError(toMessage(err));
    }
  }

  async function handleFiles(fileList: FileList | File[]) {
    const targetSlug = selectedSlug;
    if (!targetSlug) {
      return;
    }
    const files = Array.from(fileList);
    if (files.length === 0) {
      return;
    }

    const rows: UploadRow[] = files.map((file) => ({ file, status: "reading" }));
    // 每批一个身份标记。只比对 slug 不够：在同一个相册里连续拖两次，
    // 后一批会把 uploadRows 整体换成更短的数组，而前一批仍在 await
    // readDimensions 的循环会按自己的原始下标写回，越界展开 undefined
    // 得到没有 file 字段的行，渲染 row.file.name 时抛 TypeError，
    // ErrorBoundary 会把整个管理页换成错误提示——上传却还在后台继续。
    const batch = Symbol("upload-batch");
    activeBatchRef.current = batch;
    setUploadRows(rows);

    const okFiles: File[] = [];
    const okWidths: number[] = [];
    const okHeights: number[] = [];
    const rowIndexOf: number[] = [];

    // 这一批仍然是当前批次，且相册没被切走，写回才安全。
    const stillCurrent = () =>
      activeBatchRef.current === batch && activeSlugRef.current === targetSlug;

    for (let i = 0; i < files.length; i++) {
      try {
        const { w, h } = await readDimensions(files[i]);
        okFiles.push(files[i]);
        okWidths.push(w);
        okHeights.push(h);
        rowIndexOf.push(i);
        if (!stillCurrent()) {
          continue;
        }
        setUploadRows((prev) => {
          const next = [...prev];
          next[i] = { ...next[i], status: "uploading", w, h };
          return next;
        });
      } catch {
        if (!stillCurrent()) {
          continue;
        }
        setUploadRows((prev) => {
          const next = [...prev];
          next[i] = { ...next[i], status: "error", error: "could not read image dimensions" };
          return next;
        });
      }
    }

    if (okFiles.length === 0) {
      return;
    }

    // Correlate the batch response back to rows by filename (the Worker's
    // uploaded/failed arrays don't carry the original index). Duplicate
    // filenames within one selection resolve FIFO — fine at personal-album
    // scale, not a general solution.
    const pending = new Map<string, number[]>();
    okFiles.forEach((file, k) => {
      const arr = pending.get(file.name) ?? [];
      arr.push(rowIndexOf[k]);
      pending.set(file.name, arr);
    });
    const takeRow = (name: string): number | undefined => pending.get(name)?.shift();

    try {
      const result: UploadResult = await uploadPhotos(targetSlug, okFiles, okWidths, okHeights);
      setUploadRows((prev) => {
        const next = [...prev];
        result.uploaded.forEach((u) => {
          const idx = takeRow(u.file);
          if (idx !== undefined) {
            next[idx] = { ...next[idx], status: "done" };
          }
        });
        result.failed.forEach((f) => {
          const idx = takeRow(f.file);
          if (idx !== undefined) {
            next[idx] = { ...next[idx], status: "error", error: f.error ?? "upload failed" };
          }
        });
        return next;
      });
      if (activeSlugRef.current === targetSlug) {
        await Promise.all([loadPhotos(targetSlug), loadAlbums()]);
      }
    } catch (err) {
      const message = toMessage(err);
      setUploadRows((prev) =>
        prev.map((row) => (row.status === "uploading" ? { ...row, status: "error", error: message } : row)),
      );
    }
  }

  return (
    <div className="relative z-0 bg-primary min-h-screen flex flex-col">
      <Navbar />
      <div className="px-4 sm:px-8 pt-28 pb-16 max-w-[1000px] mx-auto flex-1 w-full">
        <Link to="/" className="text-secondary hover:text-white text-[14px] transition-colors">
          ← Back to site
        </Link>

        <h1 className={`${styles.sectionHeadText} text-white mt-4`}>Album admin</h1>
        <p className="mt-2 text-secondary text-[14px]">
          {"Create albums, upload photos, and manage covers / order. Every write here goes to " +
            "/api/admin/*, which Cloudflare Access + the Worker's own JWT check protect."}
        </p>

        <section className="mt-10 bg-black-100 rounded-2xl p-6">
          <h2 className="text-white font-semibold text-[18px] mb-4">New album</h2>
          <form onSubmit={handleCreateAlbum} className="flex flex-col gap-4 max-w-md">
            <label className="flex flex-col gap-1">
              <span className="text-white text-[13px] font-medium">Slug (lowercase, digits, hyphens)</span>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="2026-example-trip"
                className="bg-tertiary py-2.5 px-4 placeholder:text-secondary text-white rounded-lg outline-hidden border-none font-medium text-[14px]"
                disabled={creating}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-white text-[13px] font-medium">Name (中文)</span>
              <input
                value={nameZh}
                onChange={(e) => setNameZh(e.target.value)}
                className="bg-tertiary py-2.5 px-4 placeholder:text-secondary text-white rounded-lg outline-hidden border-none font-medium text-[14px]"
                disabled={creating}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-white text-[13px] font-medium">Name (English)</span>
              <input
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                className="bg-tertiary py-2.5 px-4 placeholder:text-secondary text-white rounded-lg outline-hidden border-none font-medium text-[14px]"
                disabled={creating}
              />
            </label>
            {createError && <p className="text-red-400 text-[13px]">{createError}</p>}
            <button
              type="submit"
              disabled={creating}
              className="bg-tertiary py-2.5 px-6 rounded-xl outline-hidden w-fit text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-tertiary/80 transition-colors text-[14px]"
            >
              {creating ? "Creating…" : "Create album"}
            </button>
          </form>
        </section>

        <section className="mt-10">
          <h2 className="text-white font-semibold text-[18px] mb-4">Albums</h2>
          {albumsError && <p className="text-red-400 text-[13px] mb-3">{albumsError}</p>}
          {albums === null && !albumsError && <p className="text-secondary text-[14px]">Loading…</p>}
          {albums !== null && albums.length === 0 && (
            <p className="text-secondary text-[14px]">No albums yet — create one above.</p>
          )}
          {albums !== null && albums.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {albums.map((a) => (
                <button
                  key={a.slug}
                  type="button"
                  onClick={() => setSelectedSlug(a.slug)}
                  className={`px-4 py-2 rounded-xl text-[13px] transition-colors ${
                    selectedSlug === a.slug ? "bg-secondary text-black" : "bg-tertiary text-white hover:bg-tertiary/70"
                  }`}
                >
                  {a.name} ({a.photoCount})
                </button>
              ))}
            </div>
          )}
        </section>

        {selectedSlug && (
          <>
            <section className="mt-10 bg-black-100 rounded-2xl p-6">
              <h2 className="text-white font-semibold text-[18px] mb-4">{`Upload to "${selectedSlug}"`}</h2>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleFiles(e.dataTransfer.files);
                }}
                className="border-2 border-dashed border-secondary/40 rounded-xl p-8 text-center text-secondary"
              >
                <p className="mb-3 text-[14px]">Drag photos here, or</p>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    if (e.target.files) {
                      handleFiles(e.target.files);
                    }
                    e.target.value = "";
                  }}
                  className="text-[13px] text-white mx-auto"
                />
              </div>

              {uploadRows.length > 0 && (
                <ul className="mt-4 flex flex-col gap-2">
                  {uploadRows.map((row, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between gap-4 text-[13px] bg-tertiary rounded-lg px-3 py-2"
                    >
                      <span className="text-white truncate">{row.file.name}</span>
                      <span
                        className={
                          row.status === "error"
                            ? "text-red-400"
                            : row.status === "done"
                              ? "text-green-400"
                              : "text-secondary"
                        }
                      >
                        {row.status === "reading" && "reading dimensions…"}
                        {row.status === "uploading" && `uploading… (${row.w}×${row.h})`}
                        {row.status === "done" && "done"}
                        {row.status === "error" && (row.error ?? "error")}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="mt-10">
              <h2 className="text-white font-semibold text-[18px] mb-4">
                Photos ({photos.length}
                {cursor ? "+" : ""})
              </h2>
              {photosError && <p className="text-red-400 text-[13px] mb-3">{photosError}</p>}
              {photosLoading && photos.length === 0 && <p className="text-secondary text-[14px]">Loading…</p>}
              {!photosLoading && photos.length === 0 && !photosError && (
                <p className="text-secondary text-[14px]">No photos yet.</p>
              )}
              <div className="flex flex-col gap-2">
                {photos.map((photo, idx) => (
                  <PhotoRow
                    key={photo.id}
                    photo={photo}
                    index={idx}
                    isCover={photo.key === coverKey}
                    onDelete={handleDeletePhoto}
                    onSetCover={handleSetCover}
                    onSaveSort={handleSaveSort}
                  />
                ))}
              </div>
              {cursor && (
                <button
                  type="button"
                  onClick={handleLoadMore}
                  className="mt-4 text-[13px] px-4 py-2 rounded-xl bg-tertiary text-white hover:bg-tertiary/70"
                >
                  Load more
                </button>
              )}
            </section>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default AlbumAdmin;
