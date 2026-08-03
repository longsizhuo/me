import { lazy, Suspense, useState } from "react";
import { Link } from "react-router-dom";
import { styles } from "../styles";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { ErrorBoundary } from "../components/ErrorBoundary";
import ContentEditor from "./admin/ContentEditor";

// 相册管理是这个页面里最重的一块（要拉相册列表、缩略图、上传逻辑），
// 而多数时候进后台是来改文案的，所以按标签页懒加载。
const AlbumAdmin = lazy(() => import("./AlbumAdmin"));

type Tab = "content" | "album";

const TABS: { key: Tab; label: string; hint: string }[] = [
  { key: "content", label: "站点文案", hint: "首屏、经历、荣誉、项目等全部文字" },
  { key: "album", label: "相册", hint: "上传照片、排序、设封面" },
];

export default function Admin() {
  const [tab, setTab] = useState<Tab>("content");

  return (
    <div className="relative z-0 bg-primary min-h-screen flex flex-col">
      <Navbar />
      <div className="px-4 sm:px-8 pt-28 pb-16 max-w-[1100px] mx-auto flex-1 w-full">
        <Link to="/" className="text-secondary hover:text-white text-[14px] transition-colors">
          ← 返回站点
        </Link>

        <h1 className={`${styles.sectionHeadText} text-white mt-4`}>管理后台</h1>
        <p className="mt-2 text-secondary text-[14px] leading-6">
          所有写操作都走 /api/admin/*，由 Cloudflare Access 和 Worker 自己的 JWT 校验双重保护。
        </p>

        <div className="mt-6 flex gap-2 flex-wrap">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-[14px] transition-colors ${
                tab === t.key
                  ? "bg-white text-primary font-semibold"
                  : "bg-tertiary text-white-100 hover:bg-white/10"
              }`}
              title={t.hint}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {/* key 绑在 tab 上：切走再切回时重新挂载，重新拉一次数据，
              免得看到的是上次进来时的旧状态。 */}
          <ErrorBoundary key={tab} label={`admin-${tab}`} fallback={<p className="text-secondary">这个面板加载出错了，刷新重试。</p>}>
            {tab === "content" ? (
              <ContentEditor />
            ) : (
              <Suspense fallback={<p className="text-secondary">加载中…</p>}>
                <AlbumAdmin embedded />
              </Suspense>
            )}
          </ErrorBoundary>
        </div>
      </div>
      <Footer />
    </div>
  );
}
