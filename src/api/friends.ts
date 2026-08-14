// src/api/friends.ts
// 友链客户端：公开读走 /api/friends（主页渲染），管理走 /api/admin/friends
// （Cloudflare Access 保护，浏览器自动携带会话）。
// 公开接口返回 camelCase（foldFriend），与 album.ts 的约定一致。

import { ApiError, adminRequest } from "./album";

const BASE: string = import.meta.env.VITE_API_BASE ?? "https://longsizhuo.com";

export interface Friend {
  id: number;
  name: string;
  url: string;
  img: string;
  description: string;
  sortOrder: number;
}

export interface FriendInput {
  name: string;
  url: string;
  img?: string;
  description?: string;
  sortOrder?: number;
}

async function get<T>(path: string, { fresh = false }: { fresh?: boolean } = {}): Promise<T> {
  const res = await fetch(BASE + path, fresh ? { cache: "no-store" } : undefined);
  if (!res.ok) {
    throw new ApiError(res.status, `GET ${path} -> ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/** 主页公开友链列表（读接口带缓存，写完后传 fresh 绕过） */
export function fetchFriends(opts: { fresh?: boolean } = {}): Promise<Friend[]> {
  return get<{ friends: Friend[] }>("/api/friends", opts).then((d) => d.friends);
}

/** admin 侧列表：返回全字段（含 id / sortOrder），始终绕过缓存 */
export function fetchAdminFriends(): Promise<Friend[]> {
  return adminRequest<{ friends: Friend[] }>("/api/admin/friends", { method: "GET" }).then(
    (d) => d.friends,
  );
}

export function createFriend(input: FriendInput): Promise<{ ok: boolean; id: number }> {
  return adminRequest("/api/admin/friends", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function updateFriend(id: number, input: Partial<FriendInput>): Promise<{ ok: boolean }> {
  return adminRequest(`/api/admin/friends/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function deleteFriend(id: number): Promise<{ ok: boolean }> {
  return adminRequest(`/api/admin/friends/${id}`, { method: "DELETE" });
}
