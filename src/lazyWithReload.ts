import { lazy } from "react";
import type { ComponentType, LazyExoticComponent } from "react";

// 部署会换掉所有分片的哈希文件名，旧的当场消失。此时一个开着页面的访客点进
// 一个还没加载过的路由，浏览器就会去取一个已经不存在的 chunk。
//
// 更糟的是它拿不到 404：Caddy 的 SPA 回退连 /assets/*.js 也接，缺失分片返回的
// 是 200 + index.html。浏览器把 HTML 当 ES 模块解析，报一个语法错误，
// import() 被 reject，页面上就只剩一句「加载出错」——而访客什么都没做错，
// 只是页面开得久了一点。
//
// index.html 是 no-cache，所以刷新一定拿到新的入口和新的分片名。

// 标记必须按组件分开存。用一个共享标记的话：刷新之后别的懒加载组件先加载
// 成功、把标记清掉，坏掉的那个再失败时又看到「没刷过」，于是再刷一次 ——
// 无限循环。这不是假想，是这段代码第一版的真实行为（实测 85 次导航还在涨）。
const keyOf = (name: string) => `chunk-reload:${name}`;

// 隐私模式下 sessionStorage 可能直接抛错。存不上就退化成「永不自动刷新」，
// 总比把访客关进刷新循环强。
function alreadyReloaded(name: string): boolean {
  try {
    return sessionStorage.getItem(keyOf(name)) !== null;
  } catch {
    return true;
  }
}

function markReloaded(name: string, on: boolean): void {
  try {
    if (on) {sessionStorage.setItem(keyOf(name), "1");}
    else {sessionStorage.removeItem(keyOf(name));}
  } catch {
    // 忽略：alreadyReloaded 会当成「已经刷过」，不会陷入循环。
  }
}

// 同一次页面生命周期里只允许触发一次刷新。多个分片同时失效时，第一个触发
// 刷新就够了，其余的没必要各自再排一次。
let reloadScheduled = false;

/**
 * 和 React.lazy 一样，但分片取不到时自动刷新一次页面。
 *
 * `name` 只用来区分各组件的「已经为它刷过一次」标记，随便取，只要在本应用内
 * 唯一且跨部署稳定即可。
 *
 * 每个组件最多自动刷一次：刷完还失败说明不是版本错位而是真的坏了，这时把
 * 错误抛给 ErrorBoundary，让人看到一句话，而不是被关进刷新循环。
 */
export function lazyWithReload<P>(
  name: string,
  factory: () => Promise<{ default: ComponentType<P> }>,
): LazyExoticComponent<ComponentType<P>> {
  return lazy(async () => {
    try {
      const mod = await factory();
      // 这个组件这次加载成功了，清掉它自己的标记 —— 只清自己的，下次部署
      // 它仍然有一次自动刷新的机会。
      markReloaded(name, false);
      return mod;
    } catch (err) {
      if (alreadyReloaded(name) || reloadScheduled) {throw err;}
      reloadScheduled = true;
      markReloaded(name, true);
      window.location.reload();
      // 返回一个永不落定的 Promise：让 Suspense 保持挂起，别在刷新前闪一下
      // 错误界面。
      return new Promise<never>(() => {});
    }
  });
}
