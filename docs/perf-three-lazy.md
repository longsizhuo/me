# Deferring three.js off the critical path

Goal: the starfield backdrop (`StarsCanvas`) and rotating globe (`EarthCanvas`),
both anchored to the Contact section at the very bottom of the page, should not
cost anything on first paint. Neither contributes to LCP.

## What changed

1. **`src/components/LazyVisible.tsx`** (new) — a wrapper that renders nothing
   until an `IntersectionObserver` (rootMargin `200px`) says it's about to be
   scrolled into view, then mounts its children and disconnects. Same idiom as
   the existing `LazyImage` pattern in `Album.tsx`.
2. **`src/App.tsx`** / **`src/components/ContactAdvanced.tsx`** — `StarsCanvas`
   and `EarthCanvas` are now `React.lazy(() => import("./canvas/Stars"))` /
   `import("./canvas/Earth")`, pointing at the individual modules, never the
   `./canvas` barrel. Composition: `ErrorBoundary` (existing, unchanged labels)
   → `LazyVisible` → `Suspense fallback={null}` → the lazy canvas.
3. **`src/components/index.ts`** — dropped `EarthCanvas`/`StarsCanvas` from the
   barrel entirely, since that barrel is what `App.tsx` imports eagerly.
   `BallCanvas`/`ComputersCanvas` (already dead — nothing mounts `Tech.tsx` or
   `Computers`) are untouched but were never reachable from the entry either.
4. **`vite.config.ts`** — two build-level fixes that turned out to be required
   in addition to the component-level lazy loading (details below):
   - `build.modulePreload.resolveDependencies`: strip `vendor-three` and the
     `Earth`/`Stars`/`Ball`/`Computers` chunks from the **HTML** preload list
     only (Vite's default preload walks the whole graph, including
     dynamic-import-only chunks, and was still injecting
     `<link rel="modulepreload" href="vendor-three...">` into `index.html`
     even with zero eager `import` of it).
   - `manualChunks`: pin `scheduler`/`react`/`react-dom`/`react-is`/
     `use-sync-external-store` to their own `vendor-react` chunk, checked
     *before* the `three` rule. Root cause: `scheduler` is a plain CJS
     dependency of `react-dom` (eager) that `@react-three/fiber`'s reconciler
     also depends on (lazy). It matched none of the existing manualChunks
     rules, so — since a CJS module's `require_x()` wrapper can't be
     duplicated across chunks — Rolldown was folding its singleton into
     `vendor-three`. That forced the *entry* chunk to carry a real, static
     `import { ... } from "./vendor-three-xxx.js"` just to get react-dom's copy
     of `scheduler`, which silently defeated the lazy-loading regardless of
     the modulePreload fix. Confirmed via sourcemap + content diff against
     `node_modules/scheduler/cjs/scheduler.production.js` (byte-identical
     minified body). This is the part of "cut that path" that lives in the
     bundler config, not the component tree.

Both fixes were found by inspecting the actual built `dist/index.html` and
`dist/assets/*.js` (grep for static `import` statements into `vendor-three`),
not by reasoning about the source alone — a naive `React.lazy` conversion
looked correct in the diff but still shipped the whole chunk on first load.

## Measurement method

Playwright (Chromium), viewport 1440×1000, against `pnpm preview` (production
build) on `localhost:4173`. For "total bytes transferred" I used
`request.sizes()` (`responseBodySize + responseHeadersSize` per request,
summed after `requestfinished`) rather than the `content-length` header —
several responses (chunked/compressed) don't send `content-length`, so a naive
header sum understates the total. Same method, same viewport, same wait
timings used for both runs so the comparison is apples-to-apples.

Two passes per build:
- **no-scroll**: `goto` + 4s settle, no scrolling — this is "first load."
- **scroll**: same, then scroll to `document.body.scrollHeight` and settle —
  proves the deferred content still loads and renders when reached.

Script: `/tmp/.../scratchpad/measure.py` (ad hoc, not committed to the repo).

## Before / after

| | Before (initial load, no scroll) | After (initial load, no scroll) |
|---|---|---|
| Requests | 38 | 34 |
| Total bytes (body+headers, measured) | 5,567,516 B (~5.31 MB) | 2,290,606 B (~2.18 MB) |
| `vendor-three*.js` fetched? | **yes** | **no** |
| `models/planet/*` fetched? | **yes** | **no** |
| Gzipped JS shipped on first load | 554.15 kB (`rolldown-runtime` 0.47 + `vendor-motion` 30.55 + `vendor-mui` 62.23 + `index` 141.50 + `vendor-three` 319.40) | 292.12 kB (`rolldown-runtime` 0.47 + `vendor-motion` 30.55 + `vendor-mui` 62.23 + `vendor-react` 57.98 + `index` 140.89) |

| | Before (after scrolling to bottom) | After (after scrolling to bottom) |
|---|---|---|
| Requests | 44 | 47 (+3: `vendor-react`, `Earth.js`, `Stars.js` are now separate chunks) |
| Total bytes (body+headers, measured) | 16,166,760 B | 16,172,988 B |
| `vendor-three*.js` / `models/planet/*` fetched? | yes (always was) | **yes** — now fetched only at this point |

Net effect: **-262 kB gzipped JS and the entire 2.9 MB GLTF/texture payload**
removed from the critical path; both are fetched exactly when the user
approaches the Contact section instead of on every page load.

(The task description's "44 requests / 4.75 MB" figure for first load and my
measured 38 req / 5.31 MB baseline differ slightly — likely measurement-method
and CDN-timing variance — but both agree on the qualitative finding:
`vendor-three` and the planet model were unconditionally on the critical
path before this change, in the exact same build.)

## Screenshot observations

- **Above the fold, before vs after**: pixel-identical (same hero section,
  same layout) — confirms the visible page above the fold is unchanged.
- **After scrolling to the bottom**: both the rotating textured globe (Earth,
  wrapped in the stylized wireframe shell) and the starfield backdrop (pink/
  purple dots animating behind the Contact form) render correctly. Confirmed
  visually via screenshot, not inferred from absence of console errors.

## Verification

- `pnpm lint` — exit 0 (`--max-warnings 0`).
- `pnpm tsc` — 60 errors (unchanged baseline).
- `pnpm test` — 15/15 pass.
- `dist` inode unchanged across every rebuild in this session
  (`4721781` before and after the final publish build) — the bind mount into
  Caddy's namespace was never broken.
- `https://longsizhuo.com/` — HTTP 200.
- `scripts/verify-page.py https://longsizhuo.com/` against the live site: 2
  console errors + 3 failed requests — exactly the documented pre-existing
  baseline (`lottie.host` 403, 2× `google-analytics.com` `ERR_ABORTED`), not
  exceeded.
