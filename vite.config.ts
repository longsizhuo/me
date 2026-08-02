import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
// @ts-expect-error scripts/ 是纯 ESM，没有类型声明；只在构建期跑。
import { geo } from "./scripts/geo.mjs";

export default defineConfig({
  plugins: [react(), geo()],
  assetsInclude: ["**/*.HEIC", "**/*.heic"],
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
  build: {
    modulePreload: {
      // ponytail: Vite's default HTML preload walks the whole graph, including
      // chunks only reachable through a React.lazy()/dynamic import() — so
      // vendor-three ends up <link rel="modulepreload"> in index.html even
      // though nothing eager imports it, defeating the point of lazy-loading
      // three.js. Strip it (and the canvas chunks) from the HTML preload list
      // only; keep it in the "js" list so the runtime preloads it in parallel
      // *when* Earth/Stars are actually dynamically imported.
      resolveDependencies: (_filename, deps, { hostType }) =>
        hostType === "html"
          ? deps.filter((dep) => !/vendor-three|\/(Earth|Stars|Ball|Computers)-/.test(dep))
          : deps,
    },
    rolldownOptions: {
      output: {
        manualChunks(id: string) {
          // ponytail: must run before the "three" check below. `scheduler` is a
          // plain CJS dep of react-dom (eager) that @react-three/fiber's
          // reconciler ALSO pulls in (lazy). It matched none of the rules here,
          // so with no explicit home Rolldown was folding its singleton CJS
          // wrapper into vendor-three (a CJS module can't be duplicated across
          // chunks, so whichever manual chunk needs it "wins") — which in turn
          // forced the eager entry chunk to statically import from vendor-three
          // just to get react-dom's copy of scheduler. Pin it (and react itself,
          // and use-sync-external-store, which zustand pulls in for fiber) to
          // their own chunk so they can never be absorbed into vendor-three.
          if (/node_modules\/(scheduler|react-is|react-dom|react|use-sync-external-store)\//.test(id)) {
            return "vendor-react";
          }
          if (id.includes("three") || id.includes("@react-three") || id.includes("maath")) {
            return "vendor-three";
          }
          if (id.includes("@mui") || id.includes("@emotion")) {
            return "vendor-mui";
          }
          if (id.includes("node_modules/motion")) {
            return "vendor-motion";
          }
        },
      },
    },
  },
});
