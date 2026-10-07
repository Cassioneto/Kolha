# Esquema Backend - Fluxos

Flow Criar Oferta:
React /nova compress img <150KB -> POST /api/ofertas Hono zod validação -> D1 INSERT ofertas + R2 PUT foto_r2 -> 201 + id -> React mostra "Na fila - 2100kg acumulados - Falta 1400kg"

Flow Matcher Cron:
Cron 5min manhã -> Worker scheduled() -> DB SELECT ofertas agregada -> agrupa por rota+grupo -> FFD loop -> fecha #1042 -> INSERT fretes + UPDATE ofertas em_frete + INSERT matcher_logs + INSERT sms_logs mock agregadoras "Seu lote #1042" + INSERT sms_logs mock camionistas "FRETE #1042 DISPONIVEL" -> fim <2s

Flow Aceite SMS:
telcosms.ao webhook real ou /admin/simular-sms -> POST /api/webhooks/sms {from:923000100,text:ACEITO 1042} -> regex parser -> D1 BEGIN -> UPDATE fretes SET camionista_id=from,status=aceito WHERE codigo=1042 AND status=oferecido -> check changes -> if 0 -> sendSMS mock from "Ja foi aceite" + ROLLBACK else COMMIT + INSERT sms_logs + sendSMS para cada agregadora em agregadoras_json "Frete #1042 aceito por Tio Domingos 923000100" -> Kanban move

Flow Recolha e Entrega:
Tio manda RECOLHI 1042 -> status recolhido
Tia manda CONFIRMO 1042 + foto balança POST /api/fretes/1042/confirmar -> R2 PUT prova + status recolhido_confirmado
Tio ENTREGUE 1042 -> status entregue -> UPDATE ofertas SET status=entregue WHERE id IN fretes.itens_json -> calcula tempo espera para impacto

Flow Portfolio Dashboard:
GET /api/impacto -> 3 queries D1: SELECT AVG(total_kg)/3500 as ocupacao, SUM(economia_kz), COUNT(*), AVG(tempo) -> JSON -> React Chart.js Line ocupação por dia (matcher_logs created_at) + Bar economia por rota + Lista últimos fretes