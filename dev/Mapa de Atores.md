# Mapa de Atores

**A1 - TIA ESPERANÇA - AGREGADORA - Principal 80%**
Perfil: 38-55 anos, Kikolo/30, 3-5 produtores fixos Caxito, acorda 4h
Tech: Samsung A12 2GB RAM Android 10, Unitel 500MB/semana, WhatsApp
Dor: Paga 45k frete para 800kg, tomate apodrece se atrasa
Objetivo: Pagar 10k ao invés de 45k dividindo caminhão
Permissões: CRUD só suas ofertas, ver fretes onde está incluída, CONFIRMO 1042
Fluxo: Cria oferta -> vê fila 2100kg -> recebe SMS mock Frete #1042 fechado -> vê economia 33k -> confirma recolha com foto balança

**A2 - TIO DOMINGOS - CAMIONISTA - Secundário 15% SMS Only**
Perfil: 30-45 anos, Mitsubishi Canter 3.5t, rota fixa Caxito-Talatona
Tech: Nokia botão, só SMS/chamada, zero internet, para no 30 comer funge
Dor: Volta vazio Luanda->Caxito gasta diesel
Objetivo: Caminhão sempre cheio ida e volta
Permissões: Só via SMS webhook - ACEITO, RECOLHI, ENTREGUE, AVARIA + foto opcional
Fluxo: Recebe SMS FRETE #1042 DISPONIVEL 3420kg 45k -> responde ACEITO 1042 -> se já foi pego recebe "Ja foi aceite" -> manda RECOLHI 1042 -> ENTREGUE 1042

**A3 - ADMIN / VOCÊ - Dono do Portfolio**
Perfil: Dev em Talatona
Objetivo: Demonstrar skill, forçar matcher, simular SMS, ver logs
Permissões: Tudo - forçar fechamento, simular SMS, ver D1 cru, limpar seed
Fluxo: /admin -> /admin/forcar-matcher -> /admin/simular-sms -> /sms-logs -> /matcher-logs

**A4 - VISITANTE PORTFOLIO - Recrutador**
Perfil: CTO / Recrutador quer avaliar em 60s
Objetivo: Ver algoritmo funcionando e impacto real
Permissões: Só leitura /impacto, /fretes, /sms-logs, /matcher-logs
Fluxo: /impacto -> vê 89% ocupação + 2.3M economia + gráfico + lista fretes -> clica num frete -> vê rateio e economia