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
}

interface R2Object {
  key: string;
}

interface R2HTTPMetadata {
  contentType?: string;
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
