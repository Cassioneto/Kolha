import type { Db } from './db.js';
import { newId, nowUnix } from './db.js';

export interface EnvLike {
  MODO_PORTFOLIO?: string;
  TELCOSMS_KEY?: string;
  BREVO_KEY?: string;
}

// MODO_PORTFOLIO=true → MOCK: só grava em sms_logs, não gasta telcosms.ao
export async function sendSMS(
  db: Db,
  telefone: string,
  mensagem: string,
  env: EnvLike = {},
  direcao: 'enviado' | 'recebido' = 'enviado',
): Promise<{ mock: boolean }> {
  const modoPortfolio = (env.MODO_PORTFOLIO ?? 'true') !== 'false';
  if (modoPortfolio) {
    await db.run(
      'INSERT INTO sms_logs (id, telefone, mensagem, direcao, modo, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [newId('sms'), telefone, mensagem, direcao, 'mock', nowUnix()],
    );
    console.log(`[sms-mock] -> ${telefone}: ${mensagem}`);
    return { mock: true };
  }
  try {
    const res = await fetch('https://api.telcosms.ao/v1/sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.TELCOSMS_KEY ?? ''}`,
      },
      body: JSON.stringify({ to: telefone, from: 'KOLHA', message: mensagem }),
    });
    if (!res.ok) throw new Error(`telcosms ${res.status}`);
    await db.run(
      'INSERT INTO sms_logs (id, telefone, mensagem, direcao, modo, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [newId('sms'), telefone, mensagem, direcao, 'real', nowUnix()],
    );
    return { mock: false };
  } catch (e) {
    console.error('[sms] telcosms falhou, fallback brevo', e);
    // Fallback: regista como mock para não perder o rasto no portfolio
    await db.run(
      'INSERT INTO sms_logs (id, telefone, mensagem, direcao, modo, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [newId('sms'), telefone, mensagem, direcao, 'mock', nowUnix()],
    );
    return { mock: true };
  }
}

export async function logRecebido(db: Db, telefone: string, mensagem: string): Promise<void> {
  await db.run(
    'INSERT INTO sms_logs (id, telefone, mensagem, direcao, modo, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [newId('sms'), telefone, mensagem, 'recebido', 'mock', nowUnix()],
  );
}
