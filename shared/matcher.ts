import { CAPACIDADE_KG, FECHAMENTO_MIN_KG, ESPERA_MAX_S, economiaKz } from './compat.js';
import type { Db } from './db.js';
import { newId, nowUnix } from './db.js';
import { sendSMS, type EnvLike } from './sms.js';

export interface OfertaRow {
  id: string;
  produto: string;
  qtd: number;
  rota: string;
  grupo: string;
  agregadora_id: string;
  status: string;
  created_at: number;
}

export interface FecharOpts {
  rota?: string;
  grupo?: string;
  forcar?: boolean; // admin: fecha mesmo abaixo de 85%
  env?: EnvLike;
}

export interface FreteFechado {
  codigo: number;
  total_kg: number;
  rota: string;
  grupo: string;
  economia_kz: number;
  agregadoras: string[];
  qtd_ofertas: number;
}

// First Fit Decreasing: ordena por qtd DESC, agrupa por rota+grupo,
// fecha quando >= 2975kg (85%) OU espera > 24h (ou forcar=true).
export async function fecharFretes(db: Db, opts: FecharOpts = {}): Promise<FreteFechado[]> {
  const t0 = Date.now();
  const now = nowUnix();

  let sql = `SELECT * FROM ofertas WHERE status = 'agregada'`;
  const params: unknown[] = [];
  if (opts.rota) {
    sql += ` AND rota = ?`;
    params.push(opts.rota);
  }
  if (opts.grupo) {
    sql += ` AND grupo = ?`;
    params.push(opts.grupo);
  }
  sql += ` ORDER BY rota, grupo, qtd DESC LIMIT 500`;
  const ofertas = await db.all<OfertaRow>(sql, params);
  if (ofertas.length === 0) return [];

  // Agrupa por rota+grupo
  const chaves = new Map<string, OfertaRow[]>();
  for (const o of ofertas) {
    const k = `${o.rota}||${o.grupo}`;
    if (!chaves.has(k)) chaves.set(k, []);
    chaves.get(k)!.push(o);
  }

  const fechados: FreteFechado[] = [];

  // First Fit Decreasing por grupo: a lista já vem ordenada por qtd DESC.
  // Cada oferta entra no primeiro caminhão com espaço; no fim fecha
  // os caminhões que cumpram >=2975kg OU espera >24h (ou forcar=true).
  interface Bin {
    itens: OfertaRow[];
    kg: number;
    oldest: number;
  }
  const fecharBin = async (rota: string, grupo: string, bin: Bin): Promise<void> => {
    const { itens: caminhao, kg } = bin;
    if (caminhao.length === 0) return;
    const agregadoras = [...new Set(caminhao.map((o) => o.agregadora_id))];
    const economia = economiaKz(agregadoras.length);
    const codigo = await gerarCodigo(db);
    const duracao = Date.now() - t0;
    await db.run(
      `INSERT INTO fretes (codigo, total_kg, rota, grupo, itens_json, agregadoras_json, status, economia_kz, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'oferecido', ?, ?)`,
      [codigo, kg, rota, grupo, JSON.stringify(caminhao.map((o) => o.id)), JSON.stringify(agregadoras), economia, now],
    );
    for (const o of caminhao) {
      await db.run(`UPDATE ofertas SET status = 'em_frete' WHERE id = ? AND status = 'agregada'`, [o.id]);
    }
    await db.run(
      `INSERT INTO matcher_logs (id, frete_codigo, total_kg, qtd_agregadoras, duracao_ms, rota, grupo, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [newId('mtc'), codigo, kg, agregadoras.length, duracao, rota, grupo, now],
    );
    // SMS mock para as tias
    for (const o of caminhao) {
      const user = await db.first<{ telefone?: string; nome?: string }>(
        `SELECT telefone, nome FROM users WHERE id = ?`, [o.agregadora_id],
      );
      const tel = user?.telefone ?? o.agregadora_id;
      await sendSMS(
        db,
        tel,
        `KOLHA: O seu lote de ${o.qtd}kg entrou no Frete #${codigo} (${kg}kg juntos ${rota}). Economia do grupo ${economia}Kz.`,
        opts.env ?? {},
      );
    }
    // SMS mock para camionistas da rota
    const camionistas = await db.all<{ telefone: string }>(
      `SELECT telefone FROM users WHERE tipo = 'camionista' AND (rota = ? OR rota IS NULL) LIMIT 5`, [rota],
    );
    for (const c of camionistas) {
      await sendSMS(
        db,
        c.telefone,
        `KOLHA: FRETE #${codigo} DISPONIVEL ${kg}kg ${rota} 45k. Para aceitar: ACEITO ${codigo}`,
        opts.env ?? {},
      );
    }
    fechados.push({ codigo, total_kg: kg, rota, grupo, economia_kz: economia, agregadoras, qtd_ofertas: caminhao.length });
  };

  for (const [chave, lista] of chaves) {
    const [rota, grupo] = chave.split('||');
    // Grupo C isolado: nunca mistura — cada oferta viaja sozinha (não fecha lote misto).
    // Na prática: só fecha C se forcar (demo) ou se uma oferta sozinha >= 2975 (raro).
    if (grupo === 'C' && !opts.forcar) continue;

    const bins: Bin[] = [];
    for (const o of lista) {
      let colocado = false;
      for (const b of bins) {
        if (b.kg + o.qtd <= CAPACIDADE_KG) {
          b.itens.push(o);
          b.kg += o.qtd;
          b.oldest = Math.min(b.oldest, o.created_at);
          colocado = true;
          break;
        }
      }
      if (!colocado) bins.push({ itens: [o], kg: o.qtd, oldest: o.created_at });
    }
    for (const b of bins) {
      const espera = now - b.oldest;
      const pronto = opts.forcar || b.kg >= FECHAMENTO_MIN_KG || espera > ESPERA_MAX_S;
      if (!pronto) continue; // fica na fila para o próximo ciclo
      await fecharBin(rota, grupo, b);
    }
  }

  return fechados;
}

async function gerarCodigo(db: Db): Promise<number> {
  for (let i = 0; i < 20; i++) {
    const codigo = Math.floor(1000 + Math.random() * 9000);
    const existe = await db.first(`SELECT codigo FROM fretes WHERE codigo = ?`, [codigo]);
    if (!existe) return codigo;
  }
  return Math.floor(1000 + Math.random() * 9000);
}
