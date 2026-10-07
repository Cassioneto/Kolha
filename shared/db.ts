// Adaptador mínimo de base de dados: mesma interface para D1 (Cloudflare)
// e node:sqlite (dev local). Handlers só usam esta interface.

export interface DbRunResult {
  changes: number;
}

export interface Db {
  all<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;
  first<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T | null>;
  run(sql: string, params?: unknown[]): Promise<DbRunResult>;
}

export function createD1Db(d1: D1Database): Db {
  return {
    async all<T>(sql: string, params: unknown[] = []) {
      const res = await d1.prepare(sql).bind(...params).all<T>();
      return res.results ?? [];
    },
    async first<T>(sql: string, params: unknown[] = []) {
      const res = await d1.prepare(sql).bind(...params).first<T>();
      return res ?? null;
    },
    async run(sql: string, params: unknown[] = []) {
      const res = await d1.prepare(sql).bind(...params).run();
      // D1: res.meta.changes
      const changes = (res as unknown as { meta?: { changes?: number } }).meta?.changes
        ?? (res as unknown as { changes?: number }).changes
        ?? 0;
      return { changes };
    },
  };
}

// node:sqlite (Node 22.5+). Import dinâmico para não quebrar o bundle Cloudflare.
export async function createSqliteDb(path: string): Promise<Db> {
  const mod = await import('node:sqlite');
  const { DatabaseSync } = mod;
  const db = new DatabaseSync(path);
  db.exec('PRAGMA journal_mode = WAL;');
  return {
    async all<T>(sql: string, params: unknown[] = []) {
      const stmt = db.prepare(sql);
      return stmt.all(...(params as [])) as T[];
    },
    async first<T>(sql: string, params: unknown[] = []) {
      const stmt = db.prepare(sql);
      const row = stmt.get(...(params as []));
      return (row as T) ?? null;
    },
    async run(sql: string, params: unknown[] = []) {
      const stmt = db.prepare(sql);
      const r = stmt.run(...(params as []));
      const changes = Number((r as { changes?: unknown }).changes ?? 0);
      return { changes };
    },
  };
}

export function nowUnix(): number {
  return Math.floor(Date.now() / 1000);
}

export function newId(prefix: string): string {
  const r = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now().toString(36)}-${r}`;
}
