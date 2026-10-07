// Matriz de compatibilidade — invisível na UI mas vital no cérebro.
// Grupo A Horta pode misturar. Grupo B Fruta só entre si (etileno).
// Grupo C Isolado nunca mistura.

export const CAPACIDADE_KG = 3500;
export const FECHAMENTO_MIN_KG = 2975; // 85% de 3500
export const PRECO_FRETE_KZ = 45000;
export const ESPERA_MAX_S = 86400; // 24h

export const ROTAS = [
  'Caxito-Talatona',
  'Caxito-30',
  'Caxito-Kikolo',
  'Caxito-Zango',
] as const;

export type Rota = (typeof ROTAS)[number];

export const PRODUTOS_A = ['tomate', 'cebola', 'batata', 'repolho', 'cenoura', 'pimento'] as const;
export const PRODUTOS_B = ['banana', 'manga', 'abacate', 'mamao', 'ananas'] as const;
export const PRODUTOS_C = ['peixe', 'carne', 'carvao', 'fuba'] as const;

export const PRODUTOS = [...PRODUTOS_A, ...PRODUTOS_B, ...PRODUTOS_C, 'outro'] as const;
export type Produto = (typeof PRODUTOS)[number];
export type Grupo = 'A' | 'B' | 'C';

const MAPA: Record<string, Grupo> = {};
for (const p of PRODUTOS_A) MAPA[p] = 'A';
for (const p of PRODUTOS_B) MAPA[p] = 'B';
for (const p of PRODUTOS_C) MAPA[p] = 'C';

export function grupoDoProduto(produto: string): Grupo {
  const p = produto.toLowerCase().trim();
  return MAPA[p] ?? 'C'; // 'outro' e desconhecido = isolado por segurança
}

export function gruposCompativeis(a: Grupo, b: Grupo): boolean {
  // A só com A, B só com B, C nunca mistura (cada oferta C viaja com C? não — C nunca mistura nem entre si)
  // Regra portfolio: C nunca mistura → cada carga C fecha sozinha conceitualmente.
  // Para simplificar o matcher: A+A ok, B+B ok, resto não.
  return a === b && (a === 'A' || a === 'B');
}

export function mensagemIncompativel(produto: string): string {
  if (grupoDoProduto(produto) === 'B')
    return 'Ih tia, banana faz tomate apodrecer no caminho! Vamos fazer um caminhão só de fruta?';
  return 'Ih tia, este produto não pode misturar com os outros. Vamos fazer um caminhão só dele?';
}

export function economiaKz(nAgregadoras: number): number {
  if (nAgregadoras <= 1) return 0;
  return nAgregadoras * PRECO_FRETE_KZ - PRECO_FRETE_KZ;
}

export function rateio(qtd: number, total: number): { valor: number; economia: number } {
  if (total <= 0) return { valor: PRECO_FRETE_KZ, economia: 0 };
  const valor = Math.round((qtd / total) * PRECO_FRETE_KZ);
  return { valor, economia: PRECO_FRETE_KZ - valor };
}
