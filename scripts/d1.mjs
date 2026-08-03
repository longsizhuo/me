// D1 REST 客户端。content-seed.mjs 和 content-sync.mjs 都用它。
//
// 为什么不用 `npx wrangler d1 execute`：那条命令每次要冷启动 2-3 秒，而
// content-sync 是每 30 秒跑一次的常驻循环，白烧的时间比干活还多。而且带
// 参数绑定的 REST 调用能把整份 JSON 当参数传，不用担心文案里的单引号把
// 拼出来的 SQL 撑破。
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

// 公开标识符，不是密钥 —— 与 worker/wrangler.jsonc 里的同名字段一致，
// 那里是唯一事实来源，改了记得两边一起改。
const ACCOUNT_ID = "e604afaf71a0dab4d6beb8f7ec2eca66";
const DATABASE_ID = "d3adac81-915c-4fde-95ea-4ac62758fd3a";

const ENDPOINT = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}/query`;

// token 只在调用时读、只放进 Authorization 头，绝不写进日志或文件。
function readToken() {
  const fromEnv = process.env.CLOUDFLARE_API_TOKEN;
  if (fromEnv && fromEnv.trim()) return fromEnv.trim();
  return readFileSync(join(homedir(), ".cloudflare-token"), "utf8").trim();
}

/**
 * 执行一条 SQL，返回 results 数组。
 * 失败时抛错，错误信息里只带 Cloudflare 返回的 code/message，不带 token。
 */
export async function query(sql, params = []) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${readToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql, params }),
  });
  const body = await res.json();
  if (!body.success) {
    const detail = (body.errors ?? []).map((e) => `${e.code}: ${e.message}`).join("; ");
    throw new Error(`D1 ${res.status} — ${detail || "unknown error"}`);
  }
  return body.result[0].results;
}
