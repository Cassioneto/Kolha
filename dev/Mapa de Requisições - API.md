# Mapa de Requisições - API

BASE URL: /api (Hono em Pages Functions)
Auth: JWT cookie httpOnly (agregadora), SMS from para camionista, nenhum para portfolio public routes

**Ofertas:**
POST /api/ofertas - body {produto:tomate|cebola|batata|repolho|banana|..., qtd:800, rota:Caxito-Talatona|Caxito-30|Caxito-Kikolo, foto_base64?, agregadora_id} -> validação zod + compress img -> D1 INSERT ofertas status=agregada + R2 PUT foto_r2 -> 201 {id}
GET /api/ofertas?rota=Caxito-Talatona&status=agregada&grupo=A -> lista para UI e matcher
GET /api/ofertas/:id -> detalhe
DELETE /api/ofertas/:id -> só dona + status agregada

**Fretes:**
POST /api/fretes/fechar - interno Worker + admin - body {rota?, grupo?} -> SELECT ofertas agregada GROUP BY rota,grupo ORDER BY qtd DESC -> FFD loop -> se fecha -> INSERT fretes codigo 1000-9999 random UNIQUE total_kg itens_json agregadoras_json economia_kz -> UPDATE ofertas SET status=em_frete WHERE id IN -> INSERT matcher_logs duracao_ms -> INSERT sms_logs mock para agregadoras e camionistas -> 201 {codigo, total_kg, economia}
GET /api/fretes?status=oferecido|aceito|recolhido|entregue -> Kanban
GET /api/fretes/:codigo -> {codigo, total_kg, itens:ofertas[], agregadoras:users[], economia_kz, rateio:[{agregadora_id,qtd,valor_proporcional}], status, camionista}
POST /api/fretes/:codigo/forcar - admin - força fechamento mesmo <85%
POST /api/fretes/:codigo/confirmar - body {foto_base64} -> R2 + status recolhido

**Webhooks SMS - telcosms.ao:**
POST /api/webhooks/sms - body {from:923000000, text:"ACEITO 1042", provider:telcosms} -> regex /^(ACEITO|RECOLHI|ENTREGUE|AVARIA|CONFIRMO)\s+(\d{4})$/i -> D1 transaction:
ACEITO: UPDATE fretes SET camionista_id=from,status=aceito WHERE codigo=1042 AND status=oferecido -> if changes==0 -> sendSMS(from,"Frete ja foi aceite") else sendSMS agregadoras "Frete #1042 aceito por Tio..."
RECOLHI: UPDATE fretes status=recolhido
ENTREGUE: UPDATE fretes status=entregue + UPDATE ofertas status=entregue
AVARIA: status=avaria + notifica agregadoras + busca backup camionistas mesma rota
CONFIRMO: marca prova recolha

**Logs Portfolio:**
GET /api/sms-logs?limit=50 -> lista mocks para /sms-logs
GET /api/matcher-logs -> lista para /matcher-logs
GET /api/impacto -> {ocupacao_media:89, economia_total:2300000, caminhoes:127, tempo_medio_espera:6, por_rota:[], por_dia:[]}
GET /api/admin/rotas -> [{rota, kg_acumulado, qtd_tias, qtd_ofertas, falta_para_fechar}]

**Cron:**
Worker kolha-matcher scheduled() -> para cada rota distinta em ofertas agregada -> fetch POST /api/fretes/fechar interno com service binding