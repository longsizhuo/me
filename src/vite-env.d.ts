/// <reference types="vite/client" />

// No top-level import/export here on purpose: this file must stay a global
// script, not a module. `declare global { }` + `export {}` would turn the
// shorthand `declare module "maath/..."` below into a same-module
// *augmentation* of an untyped module, which TS silently drops instead of
// applying — confirmed by reproducing in isolation. Plain global ambient
// declarations avoid that trap.

interface Window {
  // Set by the GA4 snippet injected in index.html; optional because it's
  // absent until that script tag loads (and always absent in dev).
  gtag?: (...args: unknown[]) => void;
}

// maath ships no types at all (checked npm: no @types/maath package exists).
declare module "maath/random/dist/maath-random.esm";
