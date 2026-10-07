import { createApp } from '../shared/app.js';
import { createD1Db } from '../shared/db.js';
import { fecharFretes } from '../shared/matcher.js';

const app = createApp();

export interface WorkerEnv {
  DB: D1Database;
  FOTOS?: R2Bucket;
  CACHE?: KVNamespace;
  MODO_PORTFOLIO?: string;
  ASSETS?: { fetch: typeof fetch };
}

export default {
  async fetch(request: Request, env: WorkerEnv, ctx: ExecutionContext) {
    return app.fetch(request, env as never, ctx as never);
  },

  // Cérebro: corre a cada 5min de manhã / 15min resto — junta cargas até lotar 3.5t
  async scheduled(_event: ScheduledEvent, env: WorkerEnv, _ctx: ExecutionContext) {
    const db = createD1Db(env.DB);
    const fechados = await fecharFretes(db, { env: { MODO_PORTFOLIO: env.MODO_PORTFOLIO ?? 'true' } });
    console.log(`[kolha-matcher] fechados: ${fechados.length}`, fechados.map((f) => `#${f.codigo}`).join(' '));
  },
};
