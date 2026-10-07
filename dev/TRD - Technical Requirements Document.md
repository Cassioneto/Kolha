# TRD - Technical Requirements Document

**Arquitetura:** 100% Cloudflare Serverless Free Tier - Sem servidor próprio
Frontend: dist/ React Vite -> Cloudflare Pages
Backend: /functions/api/* Hono.js + zod + service bindings
DB: D1 binding DB - SQLite 5GB free 5M reads/day
Storage: R2 binding FOTOS - 10GB free - fotos balança <150KB compress frontend
Cache: KV binding CACHE - 100k reads free - cache rotas kg acumulado 5min
Vars: MODO_PORTFOLIO=true, TELCOSMS_KEY, BREVO_KEY, ROTA_CAPACIDADE=3500, FECHAMENTO_MIN=2975

**Schema D1 - schema.sql:**
CREATE TABLE users (id TEXT PRIMARY KEY, telefone TEXT UNIQUE NOT NULL, nome TEXT, tipo TEXT CHECK(tipo IN ('agregadora','camionista','produtor')), rota TEXT, created_at INTEGER);
CREATE TABLE ofertas (id TEXT PRIMARY KEY, produto TEXT NOT NULL, qtd INTEGER NOT NULL CHECK(qtd 50-3500), rota TEXT NOT NULL, grupo TEXT NOT NULL CHECK(grupo IN ('A','B','C')), agregadora_id TEXT NOT NULL REFERENCES users(id), status TEXT DEFAULT 'agregada' CHECK(status IN ('agregada','em_frete','entregue','expirada')), foto_r2 TEXT, created_at INTEGER NOT NULL);
CREATE TABLE fretes (codigo INTEGER PRIMARY KEY, total_kg INTEGER NOT NULL, itens_json TEXT NOT NULL, agregadoras_json TEXT NOT NULL, camionista_id TEXT, status TEXT DEFAULT 'oferecido' CHECK(status IN ('oferecido','aceito','recolhido','entregue','avaria')), economia_kz INTEGER NOT NULL, created_at INTEGER NOT NULL);
CREATE TABLE sms_logs (id TEXT PRIMARY KEY, telefone TEXT NOT NULL, mensagem TEXT NOT NULL, direcao TEXT CHECK(direcao IN ('enviado','recebido')), modo TEXT DEFAULT 'mock' CHECK(modo IN ('mock','real')), created_at INTEGER NOT NULL);
CREATE TABLE matcher_logs (id TEXT PRIMARY KEY, frete_codigo INTEGER REFERENCES fretes(codigo), total_kg INTEGER, qtd_agregadoras INTEGER, duracao_ms INTEGER, created_at INTEGER);
CREATE INDEX idx_ofertas_rota_status ON ofertas(rota,status);
CREATE INDEX idx_fretes_status ON fretes(status);

**Algoritmo Matcher - kolha-matcher Worker:**
Input: 500 ofertas agregada
Passos:
1. SELECT * WHERE status=agregada ORDER BY rota, grupo, qtd DESC
2. Map rota+grupo -> lista ofertas
3. Para cada lista: caminhao={kg:0,itens:[],agregadoras:Set,oldest:now}
   Para cada oferta:
     if caminhao.kg + oferta.qtd <= 3500 AND caminhao.grupo==oferta.grupo:
       push
       agregadoras.add
       kg+=qtd
     if caminhao.kg >= 2975 OR now-oldest>86400:
       codigo = random 1000-9999 not exists
       economia = agregadoras.size*45000 - 45000
       INSERT fretes
       UPDATE ofertas SET status=em_frete WHERE id IN caminhao.itens
       INSERT matcher_logs
       Para cada agregadora: sendSMS mock "Seu lote entrou #codigo economia X"
       Para camionistas rota: sendSMS mock "FRETE #codigo DISPONIVEL Ykg"
       reset caminhao
Complexidade O(n log n) por sort + O(n) FFD

**Integrações:**
sendSMS(telefone,mensagem,env):
if MODO_PORTFOLIO: await DB INSERT sms_logs modo mock + console.log + return {mock:true}
else: try fetch telcosms.ao Bearer TELCOSMS_KEY {to,from:KOLHA,message} catch -> fallback fetch Brevo SMS + INSERT sms_logs modo real + retry 3x backoff
sendEmail(): if MODO_PORTFOLIO log else fetch api.brevo.com/v3/smtp/email api-key BREVO_KEY

**Segurança & Limites Free Tier:**
Rate limit: KV 100 req/min por IP, telefone UNIQUE, zod validação, transaction anti-corrida WHERE status=oferecido
Compress: browser-image-compression frontend max 150KB antes R2
D1 free: 5M reads/dia -> usar LIMIT 500 no matcher, cache rotas em KV 5min

**Wrangler.toml:**
name=kolha
pages_build_output_dir=dist
[[d1_databases]] binding=DB database_name=kolha-db database_id=...
[[r2_buckets]] binding=FOTOS bucket_name=kolha-fotos
[[kv_namespaces]] binding=CACHE id=...
[vars] MODO_PORTFOLIO="true" CAPACIDADE="3500" FECHAMENTO_MIN="2975"
[triggers] crons=["*/5 5-9 * * *","*/15 * * * *"]