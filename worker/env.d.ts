// Minimal ambient types for the Cloudflare Workers globals this code
// actually calls. Not @cloudflare/workers-types — the project has a
// no-new-dependency policy, and this is smaller than that package anyway.
// Extend as later tasks (upload/delete) need more of D1Database/R2Bucket.

interface D1Meta {
  last_row_id: number;
  changes: number;
  duration: number;
}

interface D1Result<T = unknown> {
  results: T[];
  success: boolean;
  meta: D1Meta;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<D1Result<T>>;
  run(): Promise<D1Result>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  // Runs every statement sequentially inside one implicit transaction —
  // all commit or none do. Added for admin.ts's cross-album photo move,
  // which needs several dependent writes to land atomically.
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
}

interface R2Object {
  key: string;
}

interface R2HTTPMetadata {
  contentType?: string;
  // R2 会把它原样写进对象的响应头。content/ 下的图片名字自带随机后缀、换图
  // 就是换 key，所以那条上传路径给它设了 immutable 的长缓存。
  cacheControl?: string;
}

interface R2PutOptions {
  httpMetadata?: R2HTTPMetadata;
  // Passing the digest of the body lets R2 itself reject the write if the
  // bytes it received don't hash to this value — the fix for a transfer that
  // stalls partway while Content-Length still reports the intended size (see
  // worker/src/admin.ts's upload path for where this is computed).
  sha256?: ArrayBuffer | string;
}

interface R2Bucket {
  get(key: string): Promise<R2Object | null>;
  put(
    key: string,
    value: ArrayBuffer | ArrayBufferView | ReadableStream | Blob | string,
    options?: R2PutOptions,
  ): Promise<R2Object>;
  delete(keys: string | string[]): Promise<void>;
}
