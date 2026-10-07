import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { z } from 'zod';
import { grupoDoProduto, PRODUTOS, ROTAS, rateio, economiaKz, PRECO_FRETE_KZ, CAPACIDADE_KG, FECHAMENTO_MIN_KG } from './compat.js';
import type { Db } from './db.js';
import { createD1Db, nowUnix, newId } from './db.js';
import { fecharFretes } from './matcher.js';
import { sendSMS, logRecebido } from './sms.js';

export interface Bindings {
  DB: D1Database;
  FOTOS?: R2Bucket;
  CACHE?: KVNamespace;
  MODO_PORTFOLIO?: string;
  CAPACIDADE?: string;
  FECHAMENTO_MIN?: string;
}

type Ctx = { Bindings: Bindings };

const OfertaSchema = z.object({
  produto: z.string().min(2).max(30),
  qtd: z.coerce.number().int().min(50).max(3500),
  rota: z.string().min(3).max(40),
  foto_base64: z.string().max(500_000).optional(),
  agregadora_id: z.string().min(3).max(40),
  nome: z.string().max(60).optional(),
});

const SmsSchema = z.object({
  from: z.string().min(5).max(20),
  text: z.string().min(3).max(160),
  provider: z.string().optional(),
});

const SMS_RE = /^(ACEITO|RECOLHI|ENTREGUE|AVARIA|CONFIRMO)\s+(\d{4})$/i;

async function getDb(c: { env: Bindings }): Promise<Db> {
  return createD1Db(c.env.DB);
}

function envLike(c: { env: Bindings }) {
  return { MODO_PORTFOLIO: c.env.MODO_PORTFOLIO ?? 'true' };
}

async function garantirAgregadora(db: Db, idOuTel: string, nome?: string) {
  let user = await db.first<{ id: string; telefone: string }>(
    `SELECT id, telefone FROM users WHERE id = ? OR telefone = ?`, [idOuTel, idOuTel],
  );
  if (user) return user.id;
  const id = idOuTel.length <= 12 && /^[0-9+]+$/.test(idOuTel) ? `u-${idOuTel}` : newId('u');
  const tel = /^[0-9+]{5,}$/.test(idOuTel) ? idOuTel : '923000000';
  await db.run(
    `INSERT INTO users (id, telefone, nome, tipo, rota, created_at) VALUES (?, ?, ?, 'agregadora', 'Caxito-Talatona', ?)`,
    [id, tel, nome ?? `Tia ${tel.slice(-3)}`, nowUnix()],
  );
  return id;
}

async function guardarFoto(c: { env: Bindings }, db: Db, ofertaId: string, foto_base64?: string): Promise<{ foto_r2: string | null; foto_data: string | null }> {
  if (!foto_base64) return { foto_r2: null, foto_data: null };
  // Normaliza dataURL
  const dataUrl = foto_base64.startsWith('data:') ? foto_base64 : `data:image/jpeg;base64,${foto_base64}`;
  try {
    if (c.env.FOTOS) {
      const key = `ofertas/${ofertaId}.jpg`;
      const base64 = dataUrl.split(',')[1] ?? '';
      const bin = Uint8Array.from(atob(base64), (ch) => ch.charCodeAt(0));
      await c.env.FOTOS.put(key, bin, { httpMetadata: { contentType: 'image/jpeg' } });
      return { foto_r2: key, foto_data: null };
    }
  } catch {
    // cai para foto_data
  }
  return { foto_r2: null, foto_data: dataUrl.slice(0, 300_000) };
}

export function createApp() {
  const app = new Hono<Ctx>();
  app.use('/api/*', cors());

  app.get('/api/health', (c) => c.json({ ok: true, app: 'kolha', modo: c.env.MODO_PORTFOLIO ?? 'true' }));

  // ---------- OFERTAS ----------
  app.post('/api/ofertas', async (c) => {
    const db = await getDb(c);
    const body = await c.req.json().catch(() => ({}));
    const parsed = OfertaSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ erro: 'Carga inválida', detalhes: parsed.error.flatten() }, 400);
    }
    const { produto, qtd, rota, foto_base64, agregadora_id, nome } = parsed.data;
    const prod = produto.toLowerCase().trim();
    if (!(PRODUTOS as readonly string[]).includes(prod) && prod !== 'outro' && prod.length > 2) {
      // aceita mesmo assim como 'outro' → grupo C (isolado)
    }
    if (!(ROTAS as readonly string[]).includes(rota as never)) {
      return c.json({ erro: `Rota inválida. Use: ${(ROTAS as readonly string[]).join(', ')}` }, 400);
    }
    const grupo = grupoDoProduto(prod);
    const donoId = await garantirAgregadora(db, agregadora_id, nome);
    const id = newId('o');
    const { foto_r2, foto_data } = await guardarFoto(c, db, id, foto_base64);
    await db.run(
      `INSERT INTO ofertas (id, produto, qtd, rota, grupo, agregadora_id, status, foto_r2, foto_data, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'agregada', ?, ?, ?)`,
      [id, prod, qtd, rota, grupo, donoId, foto_r2, foto_data, nowUnix()],
    );
    // Fila acumulada para a UI mostrar "Você é a Nª na fila"
    const fila = await db.first<{ kg: number; n: number }>(
      `SELECT COALESCE(SUM(qtd),0) as kg, COUNT(*) as n FROM ofertas WHERE rota = ? AND grupo = ? AND status = 'agregada'`,
      [rota, grupo],
    );
    return c.json(
      { id, grupo, fila_kg: fila?.kg ?? qtd, fila_posicao: fila?.n ?? 1, falta_para_fechar: Math.max(0, CAPACIDADE_KG - (fila?.kg ?? 0)) },
      201,
    );
  });

  app.get('/api/ofertas', async (c) => {
    const db = await getDb(c);
    const rota = c.req.query('rota');
    const status = c.req.query('status') ?? 'agregada';
    const grupo = c.req.query('grupo');
    const limit = Math.min(Number(c.req.query('limit') ?? 50), 200);
    let sql = `SELECT o.*, u.nome as agregadora_nome, u.telefone as agregadora_tel FROM ofertas o LEFT JOIN users u ON u.id = o.agregadora_id WHERE 1=1`;
    const params: unknown[] = [];
    if (rota) { sql += ` AND o.rota = ?`; params.push(rota); }
    if (status && status !== 'todas') { sql += ` AND o.status = ?`; params.push(status); }
    if (grupo) { sql += ` AND o.grupo = ?`; params.push(grupo); }
    sql += ` ORDER BY o.created_at DESC LIMIT ?`;
    params.push(limit);
    const rows = await db.all(sql, params);
    return c.json({ ofertas: rows });
  });

  app.get('/api/ofertas/:id', async (c) => {
    const db = await getDb(c);
    const row = await db.first(`SELECT o.*, u.nome as agregadora_nome, u.telefone as agregadora_tel FROM ofertas o LEFT JOIN users u ON u.id = o.agregadora_id WHERE o.id = ?`, [c.req.param('id')]);
    if (!row) return c.json({ erro: 'Carga não encontrada' }, 404);
    return c.json(row);
  });

  app.delete('/api/ofertas/:id', async (c) => {
    const db = await getDb(c);
    const id = c.req.param('id');
    const row = await db.first<{ status: string; agregadora_id: string }>(`SELECT status, agregadora_id FROM ofertas WHERE id = ?`, [id]);
    if (!row) return c.json({ erro: 'Carga não encontrada' }, 404);
    if (row.status !== 'agregada') return c.json({ erro: 'Esta carga já entrou num frete e não pode apagar.' }, 400);
    await db.run(`DELETE FROM ofertas WHERE id = ?`, [id]);
    return c.json({ ok: true });
  });

  // ---------- FRETES ----------
  app.post('/api/fretes/fechar', async (c) => {
    const db = await getDb(c);
    const body = await c.req.json().catch(() => ({}));
    const fechados = await fecharFretes(db, { rota: body.rota, grupo: body.grupo, env: envLike(c) });
    if (fechados.length === 0) return c.json({ fechados: [], mensagem: 'Ainda falta carga para fechar o caminhão.' });
    return c.json({ fechados }, 201);
  });

  app.get('/api/fretes', async (c) => {
    const db = await getDb(c);
    const status = c.req.query('status');
    const rota = c.req.query('rota');
    const limit = Math.min(Number(c.req.query('limit') ?? 50), 200);
    let sql = `SELECT * FROM fretes WHERE 1=1`;
    const params: unknown[] = [];
    if (status) { sql += ` AND status = ?`; params.push(status); }
    if (rota) { sql += ` AND rota = ?`; params.push(rota); }
    sql += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(limit);
    const rows = await db.all(sql, params);
    return c.json({ fretes: rows });
  });

  app.get('/api/fretes/:codigo', async (c) => {
    const db = await getDb(c);
    const codigo = Number(c.req.param('codigo'));
    const frete = await db.first<Record<string, unknown>>(`SELECT * FROM fretes WHERE codigo = ?`, [codigo]);
    if (!frete) return c.json({ erro: 'Frete não encontrado' }, 404);
    const ids: string[] = JSON.parse(String(frete.itens_json ?? '[]'));
    const agIds: string[] = JSON.parse(String(frete.agregadoras_json ?? '[]'));
    const itens = ids.length
      ? await db.all(`SELECT o.*, u.nome as agregadora_nome, u.telefone as agregadora_tel FROM ofertas o LEFT JOIN users u ON u.id = o.agregadora_id WHERE o.id IN (${ids.map(() => '?').join(',')})`, ids)
      : [];
    const agregadoras = agIds.length
      ? await db.all(`SELECT * FROM users WHERE id IN (${agIds.map(() => '?').join(',')})`, agIds)
      : [];
    const total = Number(frete.total_kg ?? 0);
    const porAg: Record<string, number> = {};
    for (const it of itens as { agregadora_id: string; qtd: number }[]) {
      porAg[it.agregadora_id] = (porAg[it.agregadora_id] ?? 0) + Number(it.qtd);
    }
    const rateioLista = Object.entries(porAg).map(([agregadora_id, qtd]) => {
      const r = rateio(Number(qtd), total);
      return { agregadora_id, qtd, valor_proporcional: r.valor, economia_individual: r.economia };
    });
    return c.json({ ...frete, itens, agregadoras, rateio: rateioLista, ocupacao: Math.round((total / CAPACIDADE_KG) * 100) });
  });

  app.post('/api/fretes/forcar', async (c) => {
    const db = await getDb(c);
    const body = await c.req.json().catch(() => ({}));
    const fechados = await fecharFretes(db, { rota: body.rota, grupo: body.grupo, forcar: true, env: envLike(c) });
    return c.json({ fechados }, 201);
  });

  app.post('/api/fretes/:codigo/forcar', async (c) => {
    const db = await getDb(c);
    const body = await c.req.json().catch(() => ({}));
    const fechados = await fecharFretes(db, { rota: body.rota, grupo: body.grupo, forcar: true, env: envLike(c) });
    return c.json({ fechados }, 201);
  });

  app.post('/api/fretes/:codigo/confirmar', async (c) => {
    const db = await getDb(c);
    const codigo = Number(c.req.param('codigo'));
    const body = await c.req.json().catch(() => ({}));
    const frete = await db.first(`SELECT codigo FROM fretes WHERE codigo = ?`, [codigo]);
    if (!frete) return c.json({ erro: 'Frete não encontrado' }, 404);
    if (body.foto_base64 && c.env.FOTOS) {
      try {
        const dataUrl = String(body.foto_base64);
        const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
        const bin = Uint8Array.from(atob(base64), (ch) => ch.charCodeAt(0));
        await c.env.FOTOS.put(`provas/${codigo}.jpg`, bin, { httpMetadata: { contentType: 'image/jpeg' } });
      } catch { /* mock */ }
    }
    await logRecebido(db, body.telefone ?? 'tia', `CONFIRMO ${codigo}`);
    return c.json({ ok: true, mensagem: `Prova do frete #${codigo} recebida. Obrigado, tia!` });
  });

  // ---------- SMS WEBHOOK (telcosms.ao) ----------
  async function processarSms(db: Db, env: { MODO_PORTFOLIO?: string }, from: string, text: string) {
    await logRecebido(db, from, text);
    const m = text.trim().match(SMS_RE);
    if (!m) {
      await sendSMS(db, from, 'KOLHA: Não percebi. Envie ACEITO 1042, RECOLHI 1042, ENTREGUE 1042 ou AVARIA 1042.', env);
      return { ok: false, erro: 'Comando inválido' };
    }
    const cmd = m[1].toUpperCase();
    const codigo = Number(m[2]);
    const frete = await db.first<{ codigo: number; status: string; itens_json: string; agregadoras_json: string; camionista_id: string | null; total_kg: number; rota: string }>(
      `SELECT * FROM fretes WHERE codigo = ?`, [codigo],
    );
    if (!frete) {
      await sendSMS(db, from, `KOLHA: Frete #${codigo} não existe. Verifique o código.`, env);
      return { ok: false, erro: 'Frete inexistente' };
    }

    if (cmd === 'ACEITO') {
      // Transação atómica anti-corrida: só muda se ainda estiver oferecido
      const r = await db.run(
        `UPDATE fretes SET camionista_id = ?, status = 'aceito' WHERE codigo = ? AND status = 'oferecido'`,
        [from, codigo],
      );
      if (r.changes !== 1) {
        await sendSMS(db, from, `KOLHA: Frete #${codigo} já foi aceite por outro camionista.`, env);
        return { ok: false, erro: 'Corrida perdida' };
      }
      const agIds: string[] = JSON.parse(frete.agregadoras_json ?? '[]');
      const tels = agIds.length
        ? await db.all<{ telefone: string }>(`SELECT telefone FROM users WHERE id IN (${agIds.map(() => '?').join(',')})`, agIds)
        : [];
      for (const t of tels) {
        await sendSMS(db, t.telefone, `KOLHA: Frete #${codigo} aceito pelo camionista ${from}. Recolha amanhã 07:30. Fique atenta!`, env);
      }
      await sendSMS(db, from, `KOLHA: Confirmado! Frete #${codigo} é seu. Recolha amanhã 07:30. Envie RECOLHI ${codigo} ao carregar.`, env);
      return { ok: true, estado: 'aceito' };
    }

    if (cmd === 'RECOLHI') {
      let r = await db.run(`UPDATE fretes SET status = 'recolhido' WHERE codigo = ? AND camionista_id = ? AND status = 'aceito'`, [codigo, from]);
      if (r.changes !== 1) {
        // fallback demo: aceita de qualquer camionista se estiver aceito
        r = await db.run(`UPDATE fretes SET status = 'recolhido', camionista_id = COALESCE(camionista_id, ?) WHERE codigo = ? AND status = 'aceito'`, [from, codigo]);
      }
      if (r.changes !== 1) return { ok: false, erro: 'Transição inválida' };
      await sendSMS(db, from, `KOLHA: Recolha do frete #${codigo} registada. Boa estrada! Envie ENTREGUE ${codigo} ao chegar.`, env);
      return { ok: true, estado: 'recolhido' };
    }

    if (cmd === 'ENTREGUE') {
      let r = await db.run(`UPDATE fretes SET status = 'entregue' WHERE codigo = ? AND (camionista_id = ? OR camionista_id IS NULL) AND status IN ('aceito','recolhido')`, [codigo, from]);
      if (r.changes !== 1) return { ok: false, erro: 'Transição inválida' };
      try {
        const ids: string[] = JSON.parse(frete.itens_json ?? '[]');
        if (ids.length) {
          await db.run(`UPDATE ofertas SET status = 'entregue' WHERE id IN (${ids.map(() => '?').join(',')})`, ids);
        }
      } catch { /* ignora */ }
      await sendSMS(db, from, `KOLHA: Frete #${codigo} entregue. Obrigado, tio!`, env);
      return { ok: true, estado: 'entregue' };
    }

    if (cmd === 'AVARIA') {
      await db.run(`UPDATE fretes SET status = 'avaria' WHERE codigo = ?`, [codigo]);
      const agIds: string[] = JSON.parse(frete.agregadoras_json ?? '[]');
      const tels = agIds.length
        ? await db.all<{ telefone: string }>(`SELECT telefone FROM users WHERE id IN (${agIds.map(() => '?').join(',')})`, agIds)
        : [];
      for (const t of tels) {
        await sendSMS(db, t.telefone, `KOLHA: Frete #${codigo} teve avaria. Já estamos a chamar outro camionista. Não se preocupe!`, env);
      }
      const backups = await db.all<{ telefone: string }>(`SELECT telefone FROM users WHERE tipo = 'camionista' AND telefone != ? LIMIT 3`, [from]);
      for (const b of backups) {
        await sendSMS(db, b.telefone, `KOLHA: FRETE #${codigo} URGENTE (avaria) ${frete.total_kg}kg ${frete.rota}. ACEITO ${codigo}?`, env);
      }
      return { ok: true, estado: 'avaria' };
    }

    // CONFIRMO
    await sendSMS(db, from, `KOLHA: CONFIRMO #${codigo} registado. Obrigado!`, env);
    return { ok: true, estado: 'confirmado' };
  }

  app.post('/api/webhooks/sms', async (c) => {
    const db = await getDb(c);
    const body = await c.req.json().catch(() => ({}));
    const parsed = SmsSchema.safeParse(body);
    if (!parsed.success) return c.json({ erro: 'SMS inválido' }, 400);
    const r = await processarSms(db, envLike(c), parsed.data.from, parsed.data.text);
    return c.json(r);
  });

  app.post('/api/webhooks/brevo', async (c) => {
    return c.json({ ok: true, modo: 'portfolio' });
  });

  // ---------- LOGS ----------
  app.get('/api/sms-logs', async (c) => {
    const db = await getDb(c);
    const limit = Math.min(Number(c.req.query('limit') ?? 50), 200);
    const rows = await db.all(`SELECT * FROM sms_logs ORDER BY created_at DESC LIMIT ?`, [limit]);
    return c.json({ sms: rows });
  });

  app.get('/api/matcher-logs', async (c) => {
    const db = await getDb(c);
    const limit = Math.min(Number(c.req.query('limit') ?? 50), 200);
    const rows = await db.all(`SELECT * FROM matcher_logs ORDER BY created_at DESC LIMIT ?`, [limit]);
    return c.json({ logs: rows });
  });

  // ---------- IMPACTO ----------
  app.get('/api/impacto', async (c) => {
    const db = await getDb(c);
    const agg = await db.first<{ caminhoes: number; media_kg: number; economia: number }>(
      `SELECT COUNT(*) as caminhoes, COALESCE(AVG(total_kg),0) as media_kg, COALESCE(SUM(economia_kz),0) as economia FROM fretes WHERE status != 'avaria'`,
    );
    const caminhoes = agg?.caminhoes ?? 0;
    const ocupacao_media = caminhoes ? Number(((agg!.media_kg / CAPACIDADE_KG) * 100).toFixed(1)) : 0;
    const por_rota = await db.all(
      `SELECT rota, COUNT(*) as caminhoes, COALESCE(SUM(total_kg),0) as kg, COALESCE(SUM(economia_kz),0) as economia FROM fretes WHERE status != 'avaria' GROUP BY rota ORDER BY economia DESC`,
    );
    // Últimos 7 dias de ocupação (por dia)
    const seteDias = await db.all<{ dia: string; media_kg: number; n: number }>(
      `SELECT date(created_at, 'unixepoch') as dia, AVG(total_kg) as media_kg, COUNT(*) as n FROM fretes WHERE status != 'avaria' GROUP BY dia ORDER BY dia DESC LIMIT 7`,
    );
    const por_dia = [...seteDias].reverse().map((d) => ({
      dia: d.dia.slice(5),
      ocupacao: Number((((d.media_kg ?? 0) / CAPACIDADE_KG) * 100).toFixed(1)),
    }));
    // Tempo médio de espera: média (frete.created - oferta.created) nas últimas entregas
    let tempo_medio_h = 6;
    try {
      const recentes = await db.all<{ created_at: number; itens_json: string }>(
        `SELECT created_at, itens_json FROM fretes ORDER BY created_at DESC LIMIT 20`,
      );
      const diffs: number[] = [];
      for (const f of recentes) {
        try {
          const ids: string[] = JSON.parse(f.itens_json ?? '[]');
          if (!ids.length) continue;
          const min = await db.first<{ m: number }>(
            `SELECT MIN(created_at) as m FROM ofertas WHERE id IN (${ids.map(() => '?').join(',')})`, ids,
          );
          if (min?.m) diffs.push((f.created_at - min.m) / 3600);
        } catch { /* ignora */ }
      }
      if (diffs.length) tempo_medio_h = Number((diffs.reduce((a, b) => a + b, 0) / diffs.length).toFixed(1));
    } catch { /* mantém 6 */ }
    const recentes = await db.all(`SELECT * FROM fretes ORDER BY created_at DESC LIMIT 8`);
    return c.json({
      ocupacao_media,
      economia_total: agg?.economia ?? 0,
      caminhoes,
      tempo_medio_espera_h: tempo_medio_h,
      meta_ocupacao: 90,
      por_rota,
      por_dia,
      recentes,
      preco_frete_kz: PRECO_FRETE_KZ,
      capacidade_kg: CAPACIDADE_KG,
      fecho_min_kg: FECHAMENTO_MIN_KG,
    });
  });

  // ---------- ADMIN ----------
  app.get('/api/admin/rotas', async (c) => {
    const db = await getDb(c);
    const rows = await db.all<{ rota: string; grupo: string; kg_acumulado: number; qtd_tias: number; qtd_ofertas: number }>(
      `SELECT rota, grupo, COALESCE(SUM(qtd),0) as kg_acumulado, COUNT(DISTINCT agregadora_id) as qtd_tias, COUNT(*) as qtd_ofertas
       FROM ofertas WHERE status = 'agregada' GROUP BY rota, grupo ORDER BY rota, grupo`,
    );
    return c.json({
      rotas: rows.map((r) => ({
        ...r,
        falta_para_fechar: Math.max(0, CAPACIDADE_KG - Number(r.kg_acumulado)),
        pode_fechar: Number(r.kg_acumulado) >= FECHAMENTO_MIN_KG,
      })),
    });
  });

  app.post('/api/admin/simular-sms', async (c) => {
    const db = await getDb(c);
    const body = await c.req.json().catch(() => ({}));
    const parsed = SmsSchema.safeParse({ from: body.telefone ?? body.from, text: body.mensagem ?? body.text, provider: 'mock' });
    if (!parsed.success) return c.json({ erro: 'Telefone + mensagem ACEITO 1042 necessários' }, 400);
    const r = await processarSms(db, envLike(c), parsed.data.from, parsed.data.text);
    return c.json({ simulado: true, ...r });
  });

  const FakeSchema = z.object({
    qtd_ofertas: z.coerce.number().int().min(1).max(30).default(3),
    rota: z.string().optional(),
  });

  app.post('/api/admin/simular-ofertas', async (c) => {
    const db = await getDb(c);
    const body = await c.req.json().catch(() => ({}));
    const parsed = FakeSchema.safeParse(body);
    if (!parsed.success) return c.json({ erro: 'Pedido inválido' }, 400);
    const { qtd_ofertas, rota } = parsed.data;
    const produtos = ['tomate', 'cebola', 'batata', 'repolho', 'cenoura', 'tomate', 'cebola'];
    const tias = ['u-esperanca', 'u-fatima', 'u-joao', 'u-maria'];
    const criadas: string[] = [];
    for (let i = 0; i < qtd_ofertas; i++) {
      const id = newId('o');
      const prod = produtos[Math.floor(Math.random() * produtos.length)];
      const qtd = 400 + Math.floor(Math.random() * 9) * 100; // 400..1200
      const r = rota ?? 'Caxito-Talatona';
      await garantirAgregadora(db, tias[i % tias.length]);
      await db.run(
        `INSERT INTO ofertas (id, produto, qtd, rota, grupo, agregadora_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?, 'agregada', ?)`,
        [id, prod, qtd, r, grupoDoProduto(prod), tias[i % tias.length], nowUnix()],
      );
      criadas.push(id);
    }
    return c.json({ criadas, qtd: criadas.length }, 201);
  });

  app.get('/api/economia', (c) => {
    const n = Number(c.req.query('tias') ?? 4);
    return c.json({ tias: n, sozinhas: n * PRECO_FRETE_KZ, juntas: PRECO_FRETE_KZ, economia: economiaKz(n) });
  });

  return app;
}
