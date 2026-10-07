# SPEC.MD FINAL - KOLHA - Caminhão Sempre Cheio
**Versão:** 1.0.0 Portfolio Edition
**Data:** 02/10/2026 Talatona, Luanda
**Status:** Travado para implementação
**Stack:** Cloudflare Pages + Functions (Hono) + D1 + R2 + KV + Worker Cron - 0 Kz/mês
**Demo Alvo:** kolha.pages.dev
**Custo:** 0 Kz - 100% Free Tier - telcosms.ao e brevo.com em MODO_PORTFOLIO=true = MOCK

---

## 1. VISÃO E PROBLEMA REAL ANGOLA

40% do tomate, cebola, batata de Caxito estraga porque:
- Produtor tem 200kg
- Agregadora (tia do Kikolo/30) junta 800kg
- Caminhão Canter 3.5t precisa 3500kg
- Resultado: caminhão sai com 23% lotado, cobra frete cheio 45.000Kz, produto apodrece esperando

Intermediárias são donas do mercado. Tentar eliminar = morte do projeto. Kolha empodera agregadora.

**Kolha não vende tomate. Kolha vende espaço em caminhão.**

Worker Cron pergunta a cada 5min manhã (5h-9h): "Tenho 800kg Tia Esperança + 1200kg Tia Fatima + 900kg Tio João = 2900kg todos Caxito->Talatona, todos Grupo A compatível. Posso fechar caminhão #1042?"
Se sim, fecha e mostra economia: Sozinhas 135.000Kz, Juntas 45.000Kz, Economia 90.000Kz (66%)

---

## 2. MAPA DE ATORES

**A1 - TIA ESPERANÇA - AGREGADORA - Principal 80%**
38-55 anos, vende Kikolo/30, 3-5 produtores fixos Caxito, acorda 4h. Tech: Samsung A12 2GB RAM Android 10, Unitel 500MB/semana, WhatsApp. Dor: Paga 45k para 800kg. Objetivo: Pagar 10k dividindo. Permissões: CRUD só suas ofertas. Fluxo: cria oferta -> vê fila 2100kg -> recebe mock SMS Frete #1042 fechado -> vê economia 33k -> CONFIRMO com foto balança.

**A2 - TIO DOMINGOS - CAMIONISTA - Secundário 15% SMS ONLY**
30-45 anos, Canter 3.5t rota fixa Caxito-Talatona. Tech: Nokia botão só SMS/chamada zero internet. Dor: Volta vazio Luanda->Caxito gasta diesel. Objetivo: caminhão cheio ida/volta. Permissões: só via SMS webhook ACEITO/RECOLHI/ENTREGUE/AVARIA. Fluxo: recebe FRETE #1042 DISPONIVEL 3420kg 45k -> responde ACEITO 1042 -> se já foi pego recebe "Ja foi aceite" -> RECOLHI -> ENTREGUE.

**A3 - ADMIN / VOCÊ - Portfolio**
Dev Talatona, quer demonstrar skill, forçar matcher, simular SMS, ver logs. Permissão total.

**A4 - VISITANTE PORTFOLIO - Recrutador**
Quer avaliar em 60s. Permissão leitura /impacto, /fretes, /sms-logs, /matcher-logs. Fluxo: /impacto vê 89% ocupação 2.3M Kz economia gráfico + lista fretes.

---

## 3. GLOSSÁRIO - LINGUAGEM ANGOLANA

Agregadora = Tia do mercado, kinguila, dona da bancada (nunca intermediária)
Carga/Lote = 800kg Tomate (nunca SKU/Offer)
Rota = Caxito->Talatona (nunca endereço)
Frete Fechado = #1042 código 4 dígitos
Cruzamento = Kolha juntou 4 tias (nunca matching/Bin Packing na UI)
Economia = Você economizou 34.535Kz
Recolha = Camionista foi buscar no campo
Balança/Prova = Foto da balança
Caminhão Cheio = Meta visual 3500kg 100% barra progresso
Fila = Cargas esperando fechar caminhão "Você é a 3ª na fila"
Comandos SMS = ACEITO, RECOLHI, ENTREGUE, AVARIA, CONFIRMO sempre MAIÚSCULO

**Matriz Compatibilidade (invisível mas vital):**
Grupo A Horta: tomate, cebola, batata, repolho, cenoura, pimento - PODE MISTURAR
Grupo B Fruta climatérica: banana, manga, abacate, mamão, ananás - SÓ ENTRE SI solta etileno estraga A
Grupo C Isolado: peixe seco, carne, carvão, fuba - NUNCA mistura

Erro incompatível: "Ih tia, banana faz tomate apodrecer no caminho! Vamos fazer um caminhão só de fruta? [Criar caminhão só de fruta]"

---

## 4. UX/UI DESIGN SYSTEM

**Princípios:**
1. Dedo da Tia: botão 56px altura min, touch 48px, unha grande
2. Sol de Caxito: contraste 4.5:1, sem cinza claro em branco, funciona brilho máximo 13h
3. Unitel 500MB: img max 150KB compress frontend browser-image-compression antes R2, sem vídeo
4. 3 Cliques: criar carga em 3 cliques, 4 cliques = falha UX
5. Zero Email: telefone é login, SMS é notificação, Brevo só recibo portfolio

**Tokens:**
--tomate #E63946 CTA principal, Frete Fechado, badge FECHADO
--folha #2A9D8F sucesso, economia, >=85% cheio, Entregue
--areia #F4F1DE fundo app, cards secundários
--terra #8B4513 texto principal títulos
--sol #F4A261 alerta "Falta 400kg para fechar" status Oferecido
--pimenta #9B2226 erro avaria incompatível
--noite #264653 texto secundário ícones borda
--branco #FFFFFF cards principais
Fonte Principal Inter 400/600/700, Código SMS JetBrains Mono Bold 14px para ACEITO 1042
H1 Herói Inter Bold 32px/36px "2.3M Kz", H2 Título Frete 20px/24px "Caminhão #1042 FECHADO", H3 Seção 16px/20px "Caxito->Talatona", Body 16px/24px min 16px nunca 14px, Small 14px/18px label, Mono 14px SMS
Espaçamento base 8px, cards padding 16px, gap 12px, botão margin-top 24px
Radius Card 16px sombra 0 2px 8px rgba(139,69,19,0.08), Botão 12px sem sombra cor sólida, Input 12px borda 2px #F4F1DE foco #E63946

**Componentes:**
Card Oferta: [Foto 80x80] 800kg Tomate Caxito->Talatona Tia Esperança 923000000 barra progresso 23% (800/3500) badge Na fila 3 tias na frente. Borda 2px areia radius 12px sombra leve.
Card Frete Fechado Herói: Fundo tomate ou folha texto branco "#1042 FECHADO - 97% CHEIO 3420kg/3500kg Grupo A 4 Agregadoras Hortaliças Economia 90.000Kz juntas Sua economia 33.750Kz [Ver Detalhes botão branco]" - thumbnail LinkedIn
Botão Primário: altura 56px width 100% mobile max 400px desktop fundo tomate texto branco Bold 16px radius 12px label sempre VERBO+OBJETO "Criar Minha Carga" "Aceitar Frete #1042" disabled fundo #E9C4B8 texto terra opacity 0.6 ícone Lucide 20px esquerda
Kanban Fretes Admin/Demo: colunas Oferecido|Aceito|Recolhido|Entregue drag disabled MVP mobile vira lista vertical stepper
Barra Lotação Caminhão Visual: caminhão lado SVG sendo preenchido esquerda->direita 0-49% cinza 50-84% laranja sol 85-100% verde folha + confete texto "Falta 580kg para fechar! Chama mais uma tia!"
SMS Log Portfolio: estilo WhatsApp "[10:42] -> 923000000: KOLHA: Frete #1042 fechado 3420kg Caxito->Talatona Para aceitar ACEITO 1042" fundo verde claro enviado cinza recebido modo mock
Dashboard Impacto /impacto: 4 cards KPI [Caminhões Otimizados 127 +12 semana] [Ocupação Média 89% +3% vs semana] [Economia Total 2.3M Kz +480K mês] [Tempo Médio Espera 6h -45min vs média] abaixo Chart.js Line ocupação por dia últimos 7 dias 78 82 85 89 91 88 87 média 87% meta 90%, Bar economia por rota Caxito-Talatona 1.4M Caxito-30 0.9M total 2.3M +21% vs período anterior, lista Fretes Recentes #1042 Caxito->Talatona Hoje 09:32 KM-1274 Economia +45.000Kz Otimizado #1041 Caxito->30 Ontem 16:10 KM-0981 +32.000Kz Entregue

**Wireframes 360px Mobile:**
Home: Logo Kolha • Otimização de Frete Agrícola Angola, Hero Junte sua carga pague menos frete Economize até 40% agrupando + Nova Carga vermelho, Card Caxito->Talatona 2100kg acumulados 3 produtores confirmados Saída amanhã 07:30, Bottom nav Início Cargas Atividades Perfil
Nova Carga: Header Criar Carga X, Produto Tomate Cebola Batata grid, Quantidade stepper [- 800kg +] Para Talatona Minimo por carga 300kg, Continuar verde folha
Frete Fechado: Header Frete Fechado, Card #1042 FECHADO 97% cheio 3420/3500, 4 agregadores 3420kg confirmados, Economia gerada 90.000Kz vermelho Você economizou 23% vs frete individual, Ver detalhes do frete

**Estados:**
Vazio: ilustração caminhão vazio + "Nenhuma carga hoje em Caxito-Talatona. Seja a primeira tia!" + botão Criar
Carregando: Skeleton cards não spinner infinito
Erro Unitel: "Sem rede? Sua carga ficou salva aqui. Assim que tiver net enviamos." localStorage
Sucesso: confete CSS simples + texto grande "Você economizou 33.750Kz!"

**Nunca fazer:** modal para criar carga, dropdown <48px, inglês na UI, ícone sem label, gradiente glassmorphism neumorphism blur pesado, placeholder como label, fonte <16px texto principal, email obrigatório, mostrar uuid "Oferta ID uuid" mostra "#1042"

Assets grátis: Ícones lucide-react Truck Package MapPin Camera Plus Check, Fotos Unsplash tomate cebola comprimir 150KB, Fonte Inter Google Fonts, Gráficos Chart.js, Ilustrações Undraw Empty truck

---

## 5. MAPA DE REQUISIÇÕES - API

BASE /api Hono Pages Functions Auth JWT cookie httpOnly agregadora SMS from camionista nenhum para portfolio public

POST /api/ofertas body {produto:enum tomate cebola batata repolho cenoura pimento banana manga abacate mamao ananas peixe carne carvao fuba outro, qtd:int 50-3500, rota:enum Caxito-Talatona Caxito-30 Caxito-Kikolo Caxito-Zango, foto_base64?:string <150KB, agregadora_id:text} -> validação zod + grupo auto A/B/C + compress + D1 INSERT ofertas id uuid status agregada + R2 PUT foto_r2 -> 201 {id, grupo}

GET /api/ofertas?rota=Caxito-Talatona&status=agregada&grupo=A&limit=50 -> lista para UI e matcher

GET /api/ofertas/:id -> detalhe

DELETE /api/ofertas/:id -> só dona + status agregada

POST /api/fretes/fechar -> interno Worker + admin body {rota?:string, grupo?:string} -> SELECT * WHERE status=agregada GROUP BY rota,grupo ORDER BY qtd DESC -> FFD loop capacidade 3500 fecha se >=2975 (85%) OU now-oldest>86400 (24h) -> codigo random 1000-9999 UNIQUE not exists -> economia = n_agregadoras*45000-45000 -> INSERT fretes codigo total_kg itens_json JSON ids agregadoras_json JSON economia_kz created_at unix status oferecido -> UPDATE ofertas SET status=em_frete WHERE id IN itens -> INSERT matcher_logs id frete_codigo total_kg qtd_agregadoras duracao_ms created_at -> para cada agregadora INSERT sms_logs mock "Seu lote entrou #codigo economia X" -> para cada camionista rota SELECT users WHERE tipo=camionista AND rota=rota INSERT sms_logs mock "FRETE #codigo DISPONIVEL Ykg 45k Caxito->Talatona" -> 201 {codigo,total_kg,economia,agregadoras}

GET /api/fretes?status=oferecido|aceito|recolhido|entregue|avaria&rota=... -> Kanban

GET /api/fretes/:codigo -> {codigo,total_kg,itens:ofertas[],agregadoras:users[],economia_kz,rateio:[{agregadora_id,qtd,valor_proporcional:qtd/total*45000,economia_individual:45000-valor_proporcional}],status,camionista,created_at}

POST /api/fretes/:codigo/forcar -> admin força fechamento mesmo <85% mesmo logica

POST /api/fretes/:codigo/confirmar body {foto_base64} -> R2 PUT prova balança + marca CONFIRMO

POST /api/webhooks/sms body {from:923000000,text:"ACEITO 1042",provider:telcosms} -> regex /^(ACEITO|RECOLHI|ENTREGUE|AVARIA|CONFIRMO)\s+(\d{4})$/i -> D1 transaction:
ACEITO: UPDATE fretes SET camionista_id=from,status=aceito WHERE codigo=1042 AND status=oferecido -> check this.changes==1 if 0 -> sendSMS(from,"Frete #1042 ja foi aceite por outro camionista") ROLLBACK else COMMIT + INSERT sms_logs + para cada agregadora em agregadoras_json sendSMS "Frete #1042 aceito por Tio Domingos 923000100. Recolha amanhã 07:30"
RECOLHI: UPDATE fretes SET status=recolhido WHERE codigo=1042 AND camionista_id=from
ENTREGUE: UPDATE fretes SET status=entregue WHERE codigo=1042 AND camionista_id=from + UPDATE ofertas SET status=entregue WHERE id IN fretes.itens_json + calcula tempo espera
AVARIA: status avaria + notifica agregadoras + SELECT camionistas backup mesma rota sendSMS
CONFIRMO: marca prova recolha

POST /api/webhooks/brevo -> email events delivery

GET /api/sms-logs?limit=50 -> lista mocks para /sms-logs page estilo WhatsApp

GET /api/matcher-logs?limit=50 -> lista para /matcher-logs tabela codigo kg agregadoras duracao_ms created_at

GET /api/impacto -> {ocupacao_media:AVG(total_kg)/3500, economia_total:SUM(economia_kz), caminhoes:COUNT, tempo_medio_espera:AVG(frete.created_at-oferta.created_at)/3600, por_rota:[{rota,kg,economia}], por_dia:[{dia,ocupacao}]}

GET /api/admin/rotas -> [{rota,kg_acumulado,qtd_tias,qtd_ofertas,falta_para_fechar:3500-kg,grupo}]

POST /api/admin/simular-sms body {telefone,mensagem} -> chama interno webhook sms para portfolio sem telcosms real

POST /api/admin/simular-ofertas body {qtd_ofertas} -> cria ofertas fake para teste

CRON Worker kolha-matcher scheduled() -> para cada rota distinta em ofertas agregada -> fetch interno POST /api/fretes/fechar via service binding ou direto DB

---

## 6. TRD - TECHNICAL REQUIREMENTS

**Arquitetura:** 100% Cloudflare Serverless Free Tier sem