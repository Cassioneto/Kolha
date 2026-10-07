# Plano de Implementação - 3 Dias Portfolio

DIA 1 - BASE GRÁTIS (4h):
- [ ] wrangler init kolha + Vite React + Tailwind + shadcn + lucide + Chart.js + browser-image-compression
- [ ] wrangler d1 create kolha-db + wrangler r2 bucket create kolha-fotos + wrangler kv namespace create CACHE
- [ ] Escreve schema.sql + seed.sql 20 ofertas fake + 5 users agregadoras + 3 camionistas
- [ ] wrangler.toml com bindings DB,FOTOS,CACHE, vars MODO_PORTFOLIO=true
- [ ] Functions: POST /api/ofertas, GET /api/ofertas, GET /api/fretes, GET /api/fretes/:codigo
- [ ] Pages: / (hero + card rota), /nova (3 passos), /minhas-cargas (lista), /fretes/[codigo] (detalhe economia), /admin (tabs)
- [ ] Deploy Pages kolha.pages.dev + teste criar oferta

DIA 2 - CÉREBRO - MATCHER (4h):
- [ ] Cria worker kolha-matcher wrangler.toml com crons ["*/5 5-9 * * *","*/15 * * * *"]
- [ ] Implementa FFD + matriz grupo A/B/C + regra 85% 2975kg ou 24h + economia_kz + rateio
- [ ] Functions: POST /api/fretes/fechar (usado pelo worker via service binding), GET /api/impacto, GET /api/matcher-logs, GET /api/admin/rotas, POST /api/fretes/:codigo/forcar
- [ ] Pages: /impacto com Chart.js + 4 KPI cards, /matcher-logs tabela com duracao_ms, /admin/forcar-matcher botão, Kanban /admin/fretes
- [ ] Testa seed + forçar matcher -> ver #1042 fechar com economia

DIA 3 - SMS MOCK + POLIMENTO PORTFOLIO (4h):
- [ ] mock-sms.ts sendSMS() com modo mock INSERT sms_logs + fallback Brevo
- [ ] Functions: POST /api/webhooks/sms parser regex + anti-corrida + GET /api/sms-logs + POST /api/admin/simular-sms + POST /api/admin/simular-ofertas
- [ ] Pages: /admin/simular-sms input telefone + mensagem + /sms-logs estilo WhatsApp + /fretes/[codigo] upload foto balança R2
- [ ] Polimento UX: barra lotação caminhão SVG, confete quando fecha, toast economia, compress img, skeleton loading, estados vazios
- [ ] README.md com GIF screen record (Loom), arquitetura, métricas, link demo, como rodar
- [ ] GitHub public + LinkedIn post: "Resolvi desperdício agrícola em Angola com Cloudflare free tier + Bin Packing - Demo: kolha.pages.dev - Código aberto"
- [ ] Checklist Done: criar oferta funciona, worker fecha com economia >0, simular ACEITO muda Kanban, /impacto gráfico real D1, /sms-logs mock telcosms.ao, deploy final

Pós-Dia 3 Opcional:
- [ ] Domínio kolha.ao
- [ ] PWA offline para Tia
- [ ] WhatsApp Business via Brevo