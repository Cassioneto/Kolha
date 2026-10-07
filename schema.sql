-- Kolha D1 schema (SQLite / D1 compatível)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  telefone TEXT UNIQUE NOT NULL,
  nome TEXT,
  tipo TEXT CHECK(tipo IN ('agregadora','camionista','produtor')) NOT NULL DEFAULT 'agregadora',
  rota TEXT,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS ofertas (
  id TEXT PRIMARY KEY,
  produto TEXT NOT NULL,
  qtd INTEGER NOT NULL CHECK(qtd >= 50 AND qtd <= 3500),
  rota TEXT NOT NULL,
  grupo TEXT NOT NULL CHECK(grupo IN ('A','B','C')),
  agregadora_id TEXT NOT NULL REFERENCES users(id),
  status TEXT DEFAULT 'agregada' CHECK(status IN ('agregada','em_frete','entregue','expirada')),
  foto_r2 TEXT,
  foto_data TEXT,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS fretes (
  codigo INTEGER PRIMARY KEY,
  total_kg INTEGER NOT NULL,
  rota TEXT NOT NULL DEFAULT 'Caxito-Talatona',
  grupo TEXT NOT NULL DEFAULT 'A',
  itens_json TEXT NOT NULL,
  agregadoras_json TEXT NOT NULL,
  camionista_id TEXT,
  status TEXT DEFAULT 'oferecido' CHECK(status IN ('oferecido','aceito','recolhido','entregue','avaria')),
  economia_kz INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS sms_logs (
  id TEXT PRIMARY KEY,
  telefone TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  direcao TEXT CHECK(direcao IN ('enviado','recebido')) NOT NULL DEFAULT 'enviado',
  modo TEXT DEFAULT 'mock' CHECK(modo IN ('mock','real')),
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS matcher_logs (
  id TEXT PRIMARY KEY,
  frete_codigo INTEGER REFERENCES fretes(codigo),
  total_kg INTEGER NOT NULL,
  qtd_agregadoras INTEGER NOT NULL,
  duracao_ms INTEGER NOT NULL,
  rota TEXT NOT NULL DEFAULT '',
  grupo TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ofertas_rota_status ON ofertas(rota, status);
CREATE INDEX IF NOT EXISTS idx_ofertas_grupo ON ofertas(grupo);
CREATE INDEX IF NOT EXISTS idx_fretes_status ON fretes(status);
CREATE INDEX IF NOT EXISTS idx_sms_created ON sms_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_matcher_created ON matcher_logs(created_at);
