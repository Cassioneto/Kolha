# UX/UI Glossary & Design System

**Glossário Angolano:**
Agregadora = Tia do mercado (nunca intermediária)
Carga = 800kg Tomate (nunca SKU)
Rota = Caxito->Talatona (nunca endereço)
Frete Fechado = #1042 (código 4 dígitos)
Cruzamento = Kolha juntou 4 tias (nunca matching)
Economia = Você economizou 34.535Kz
Comandos SMS = ACEITO, RECOLHI, ENTREGUE, AVARIA, CONFIRMO (sempre maiúsculo)

**Princípios:**
1. Dedo da Tia: botão 56px altura, touch 48px
2. Sol de Caxito: contraste 4.5:1, sem cinza claro em branco, funciona com brilho máximo
3. Unitel 500MB: img <150KB comprimida no frontend antes R2
4. 3 Cliques: criar carga em 3 cliques max
5. Zero Email: telefone é login, SMS é notificação

**Design Tokens:**
--tomate #E63946 CTA principal, frete fechado
--folha #2A9D8F sucesso, economia, >=85%
--areia #F4F1DE fundo app
--terra #8B4513 texto principal
--sol #F4A261 alerta falta pouco
--pimenta #9B2226 erro
--noite #264653 texto secundário
--branco #FFFFFF cards

Fontes: Inter 400/600/700 16px min, JetBrains Mono Bold para SMS ACEITO 1042
Radius: Card 16px, Botão 12px, Sombra 0 2px 8px rgba(139,69,19,0.08)

**Componentes:**
Card Oferta: Foto 80x80 + 800kg Tomate + Caxito->Talatona + Tia + barra progresso + badge fila
Card Frete Fechado Herói: Fundo #E63946 ou #2A9D8F texto branco, #1042 97% CHEIO, 4 Agregadoras, Economia 90k, Sua economia 33k, botão branco Ver Detalhes
Botão Primário: 56px altura, 100% mobile, fundo tomate, texto branco Bold, label verbo: Criar Minha Carga
Barra Lotação: Caminhão SVG lateral sendo preenchido, 0-49 cinza, 50-84 laranja sol, 85-100 verde folha + confete
SMS Log: Estilo WhatsApp, verde claro enviado, cinza recebido
Kanban: Colunas Oferecido | Aceito | Recolhido | Entregue - mobile vira stepper vertical
Dashboard /impacto: 4 KPI cards + Chart.js line ocupação por dia + bar economia por rota

**Wireframe 360px:**
Home: Hero Junte sua carga pague menos + card rota 2100kg acumulados + botão Nova Carga
Nova: Passo1 Grid produtos com foto grande, Passo2 Stepper kg gigante [- 800 +] + atalhos 100/500/1000, Passo3 Cards rota com qtd tias na fila + botão câmera + Criar
Minhas Cargas: Lista + banner Falta 580kg para fechar! Chama mais uma tia!
Frete Detalhe: Mapa linha simples Caxito->Talatona + lista tias + economia + status

**Nunca fazer:** Modal para criar carga, dropdown pequeno, inglês na UI, ícone sem label, gradiente/glassmorphism, placeholder como label, fonte <16px, pedir email obrigatório