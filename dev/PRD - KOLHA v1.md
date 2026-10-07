# PRD - KOLHA v1.0 Portfolio

**Visão:** Otimizador de lotação de caminhão, não marketplace de tomate. Junta cargas até lotar 3.5t.

**Atores:**
- Tia Esperança - Agregadora - 80% uso - Samsung A12 - 1GB Unitel - quer pagar menos frete
- Tio Domingos - Camionista - 15% - Nokia botão só SMS - quer caminhão cheio sem voltar vazio
- Recrutador - 5% - quer ver algoritmo e impacto em 60s

**MUST HAVE P0:**
US01: Tia cria oferta em 3 cliques: produto + kg + rota + foto
US02: Worker Cron 5min manhã / 15min resto - First Fit Decreasing - agrupa por rota + grupo compatível - fecha se >=2975kg (85% de 3500) OU espera >24h
US03: Calcular economia_kz = (n_agregadoras * 45000) - 45000 e rateio proporcional = qtd/total*45000 (informativo)
US04: Camionista aceita via SMS "ACEITO 1042" - webhook com transação atômica WHERE status=oferecido + check changes==1
US05: Dashboard /impacto com ocupação média AVG(total_kg)/3500 e economia total SUM(economia_kz)

**Matriz Compatibilidade:**
Grupo A Horta: tomate, cebola, batata, repolho, cenoura, pimento - pode misturar
Grupo B Fruta: banana, manga, abacate, mamão, ananás - só entre si (etileno estraga A)
Grupo C Isolado: peixe, carne, carvão, fuba - nunca mistura

**Fora do Escopo:** Pagamento real, Multicaixa, BNA, GPS, BI, App nativo

**Done:** Demo no ar, Worker fecha frete com economia >0, Simular ACEITO muda Kanban, /impacto com gráfico real D1, /sms-logs mock telcosms.ao