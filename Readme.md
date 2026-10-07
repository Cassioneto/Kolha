# KOLHA - Caminhão Sempre Cheio
> 40% do tomate de Caxito estraga porque caminhão de 3.5t sai com 800kg. Kolha junta 4 tias no mesmo caminhão e mostra economia de 75%.

**Demo:** https://kolha.semear.workers.dev
**GitHub:** github.com/seuuser/kolha
**Stack:** Cloudflare Pages + Functions + D1 + R2 + Worker Cron - 100% Free Tier
**Status:** Portfolio Edition - 100% Grátis - Sem pagamento real

### Problema Real Angola
Produtor tem 200kg, Agregadora (tia do Kikolo) tem 800kg, Caminhão precisa de 3500kg. Todo mundo paga frete cheio por caminhão vazio.

### Solução - O Cérebro
Worker Cron roda a cada 5min (5h-9h manhã) e faz Bin Packing (First Fit Decreasing):
Junta tomate + cebola + batata (Grupo A compatível) de 4 agregadoras diferentes em 1 caminhão só.
Calcula: Se fossem sozinhas = 180.000Kz, Juntas = 45.000Kz, Economia = 135.000Kz

### Como testar em 30s (Fluxo Portfolio)
1. /nova -> Cria 800kg Tomate Caxito->Talatona como Tia Esperança 923000001
2. /admin/simular-ofertas -> Cria mais 2 cargas fake para passar de 2975kg (85%)
3. /admin/forcar-matcher -> Força fechamento ou espera Cron 5min
4. /fretes/1042 -> Vê economia, rateio, lista de tias
5. /admin/simular-sms -> Digita 923000100 + "ACEITO 1042" -> Vê Kanban mudar para Aceito
6. /sms-logs -> Vê mock do telcosms.ao que seria SMS real
7. /impacto -> Vê dashboard com ocupação média 89%, economia total 2.3M Kz (Chart.js)

### Stack Técnica
- Frontend: Vite + React + Tailwind + shadcn/ui + Chart.js
- Backend: Hono.js em Cloudflare Pages Functions
- DB: D1 (SQLite) 5GB free - schema.sql
- Storage: R2 - fotos da balança <150KB
- Matcher: Worker kolha-matcher - Cron */5 5-9 * * * e */15 * * * *
- SMS: telcosms.ao MOCK quando MODO_PORTFOLIO=true (não gasta) + fallback Brevo SMS free
- Email: Brevo.com free 300/dia - recibos

### Rodar Local
npm install --prefer-offline
npm run dev
# web: http://localhost:5173 · api: http://localhost:8787 (SQLite kolha.db, seed automático)

### Arquitetura
[ Tia Mobile ] -> POST /api/ofertas -> D1 ofertas status=agregada
[ Worker Cron ] -> SELECT ofertas -> FFD Bin Packing -> INSERT fretes #1042 + sms_logs mock
[ Camionista SMS ] -> telcosms.ao webhook -> POST /api/webhooks/sms ACEITO 1042 -> D1 transaction anti-corrida
[ Visitante ] -> GET /api/impacto -> Dashboard economia

### Métricas que impressionam
- 127 caminhões otimizados (simulado)
- 89% ocupação média vs 42% antes
- 2.3M Kz economizados (calculado)

### Custo
0 Kz/mês. Tudo no free tier Cloudflare. telcosms.ao e Brevo em modo mock para portfolio.