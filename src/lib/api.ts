export interface Oferta {
  id: string;
  produto: string;
  qtd: number;
  rota: string;
  grupo: string;
  agregadora_id: string;
  agregadora_nome?: string;
  agregadora_tel?: string;
  status: string;
  foto_r2?: string | null;
  foto_data?: string | null;
  created_at: number;
}

export interface Frete {
  codigo: number;
  total_kg: number;
  rota: string;
  grupo: string;
  status: string;
  economia_kz: number;
  camionista_id?: string | null;
  created_at: number;
  ocupacao?: number;
}

export interface FreteDetalhe extends Frete {
  itens: Oferta[];
  agregadoras: { id: string; nome: string; telefone: string }[];
  rateio: { agregadora_id: string; qtd: number; valor_proporcional: number; economia_individual: number }[];
  itens_json: string;
  agregadoras_json: string;
}

export interface Impacto {
  ocupacao_media: number;
  economia_total: number;
  caminhoes: number;
  tempo_medio_espera_h: number;
  meta_ocupacao: number;
  por_rota: { rota: string; caminhoes: number; kg: number; economia: number }[];
  por_dia: { dia: string; ocupacao: number }[];
  recentes: Frete[];
}

async function req<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...init });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((data as { erro?: string }).erro ?? `Erro ${r.status}`);
  return data as T;
}

export const api = {
  criarOferta: (b: { produto: string; qtd: number; rota: string; agregadora_id: string; nome?: string; foto_base64?: string }) =>
    req<{ id: string; grupo: string; fila_kg: number; fila_posicao: number; falta_para_fechar: number }>('/api/ofertas', {
      method: 'POST', body: JSON.stringify(b),
    }),
  ofertas: (q = '') => req<{ ofertas: Oferta[] }>(`/api/ofertas${q}`),
  apagarOferta: (id: string) => req<{ ok: boolean }>(`/api/ofertas/${id}`, { method: 'DELETE' }),
  fechar: (b: { rota?: string; grupo?: string } = {}) =>
    req<{ fechados: { codigo: number; total_kg: number; economia_kz: number }[] }>('/api/fretes/fechar', {
      method: 'POST', body: JSON.stringify(b),
    }),
  forcar: (b: { rota?: string; grupo?: string } = {}) =>
    req<{ fechados: { codigo: number }[] }>(`/api/fretes/forcar`, {
      method: 'POST', body: JSON.stringify(b),
    }),
  fretes: (q = '') => req<{ fretes: Frete[] }>(`/api/fretes${q}`),
  frete: (codigo: string | number) => req<FreteDetalhe>(`/api/fretes/${codigo}`),
  confirmar: (codigo: string | number, b: { foto_base64?: string; telefone?: string }) =>
    req<{ ok: boolean; mensagem: string }>(`/api/fretes/${codigo}/confirmar`, {
      method: 'POST', body: JSON.stringify(b),
    }),
  impacto: () => req<Impacto>('/api/impacto'),
  smsLogs: (limit = 50) => req<{ sms: { id: string; telefone: string; mensagem: string; direcao: string; modo: string; created_at: number }[] }>(`/api/sms-logs?limit=${limit}`),
  matcherLogs: (limit = 50) => req<{ logs: { id: string; frete_codigo: number; total_kg: number; qtd_agregadoras: number; duracao_ms: number; rota: string; grupo: string; created_at: number }[] }>(`/api/matcher-logs?limit=${limit}`),
  rotas: () => req<{ rotas: { rota: string; grupo: string; kg_acumulado: number; qtd_tias: number; qtd_ofertas: number; falta_para_fechar: number; pode_fechar: boolean }[] }>('/api/admin/rotas'),
  simularSms: (telefone: string, mensagem: string) =>
    req<{ ok: boolean; estado?: string; erro?: string; simulado: boolean }>('/api/admin/simular-sms', {
      method: 'POST', body: JSON.stringify({ telefone, mensagem }),
    }),
  simularOfertas: (qtd_ofertas: number, rota?: string) =>
    req<{ criadas: string[]; qtd: number }>('/api/admin/simular-ofertas', {
      method: 'POST', body: JSON.stringify({ qtd_ofertas, rota }),
    }),
};

export function kz(v: number): string {
  return `${Number(v ?? 0).toLocaleString('pt-AO')}Kz`;
}

export function hora(ts: number): string {
  return new Date(ts * 1000).toLocaleString('pt-AO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}
