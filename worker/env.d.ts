// Minimal ambient types for the Cloudflare Workers globals this code
// actually calls. Not @cloudflare/workers-types — the project has a
// no-new-dependency policy, and this is smaller than that package anyway.
// Extend as later tasks (upload/delete) need more of D1Database/R2Bucket.

interface D1Result<T = unknown> {
  results: T[];
  success: boolean;
  meta: unknown;
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

interface R2Bucket {
  get(key: string): Promise<R2Object | null>;
  put(
    key: string,
    value: ArrayBuffer | ArrayBufferView | ReadableStream | Blob | string,
  ): Promise<R2Object>;
  delete(key: string): Promise<void>;
}
