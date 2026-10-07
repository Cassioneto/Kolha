// Servidor local: mesma app Hono + node:sqlite (kolha.db). Corre em :8787.
// O Vite faz proxy /api → aqui. Em produção a mesma app corre em Pages Functions + D1.
import { serve } from '@hono/node-server';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { createApp } from './shared/app.js';
import { createSqliteDb } from './shared/db.js';

const DB_PATH = process.env.KOLHA_DB ?? './kolha.db';

async function main() {
  const db = await createSqliteDb(DB_PATH);

  // Aplica schema
  const schema = readFileSync('./schema.sql', 'utf8');
  for (const stmt of schema.split(';')) {
    const s = stmt
      .split('\n')
      .filter((l) => !l.trim().startsWith('--'))
      .join('\n')
      .trim();
    if (!s) continue;
    try {
      await db.run(s);
    } catch (e) {
      console.error('[db] schema stmt falhou:', String(e).slice(0, 200));
    }
  }

  // Seed se vazio
  const n = await db.first<{ n: number }>('SELECT COUNT(*) as n FROM users');
  if (!n || Number(n.n) === 0) {
    console.log('[db] a semear dados demo...');
    const seed = readFileSync('./seed.sql', 'utf8');
    for (const raw of seed.split(';')) {
      const s = raw.trim();
      if (!s) continue;
      // ignora linhas só de comentário
      const lines = s.split('\n').filter((l) => !l.trim().startsWith('--')).join('\n').trim();
      if (!lines) continue;
      try {
        await db.run(lines);
      } catch (e) {
        console.error('[db] seed stmt falhou:', String(e).slice(0, 200));
      }
    }
  }

  const app = createApp();

  // Injeta DB sqlite em cada pedido (a app espera c.env.DB como D1 — adaptamos aqui).
  // Como a app usa createD1Db(c.env.DB), envolvemos o fetch: colocamos um faux-D1
  // que traduz prepare().bind().all/first/run para o nosso Db sqlite.
  const fauxD1 = {
    prepare(sql: string) {
      return {
        _params: [] as unknown[],
        bind(...params: unknown[]) {
          this._params = params;
          return this;
        },
        async all() {
          const rows = await db.all<Record<string, unknown>>(sql, this._params);
          return { results: rows };
        },
        async first() {
          return db.first(sql, this._params);
        },
        async run() {
          const r = await db.run(sql, this._params);
          return { meta: { changes: r.changes } };
        },
      };
    },
  };

  const { fetch: appFetch } = app as unknown as { fetch: Function };
  void appFetch;

  const server = serve(
    {
      fetch: (req: Request, info: unknown) =>
        app.fetch(req, {
          DB: fauxD1,
          MODO_PORTFOLIO: 'true',
        } as never, info as never),
      port: 8787,
    },
    (info) => console.log(`[kolha-api] http://localhost:${info.port}`),
  );
  void server;
  void existsSync;
  void mkdirSync;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
