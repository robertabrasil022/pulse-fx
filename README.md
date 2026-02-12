# INFORMAÇÕES DO PROJETO

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## 🛡️ FX PULSE | CÂMBIO E MOEDAS

Sistema inteligente de monitoramento cambial e análise de risco para importação e exportação 
Desenvolvido como projeto final do programa **DiverseDev (Ada Tech & Mercado Eletrônico)**

## 🚀 Tecnologias
- **Frontend:** React + Tailwind CSS (via Lovable)
- **Backend:** n8n (Orquestração de fluxos)
- **Lógica:** JavaScript (Function Nodes)
- **Banco de Dados:** Supabase (PostgreSQL)
- **API:** AwesomeAPI (Cotações em tempo real)

## 🏗️ Arquitetura da Solução
1. **Extração:** Script/Nó HTTP no n8n consome dados da AwesomeAPI
2. **Processamento (JS):** Cálculos de Média Móvel (7 e 30 dias) e variação percentual
3. **Persistência:** Dados e logs de integração são salvos no Supabase
4. **Visualização:** Frontend no Lovable consome o Supabase para exibir insights

## 🛠️ Configuração de Banco (Supabase)
O esquema relacional contempla as tabelas obrigatórias de dados e logs:
- `fx_rates`: Histórico de cotações.
- `profiles`: Preferências do usuário (moeda e idioma)
- `integration_logs`: Logs de sucesso/erro da automação
## Fluxo N8N
1. **Buscar Cotações via API (`HTTP Request`)**:
   - Captura em tempo real os valores de USD, EUR e CNY através da **AwesomeAPI**.
2. **Formatar Dados de Câmbio (`Edit Fields`)**:
   - Padronização do JSON, selecionando apenas o valor de compra (`bid`) e adicionando metadados de tempo (*timestamp*).
3. **Buscar Alertas Pendentes (`Get many rows`)**:
   - Consulta ao **Supabase** para pegar todos os alertas.
4. **Lógica de Disparo (`Code in JavaScript`)**:
   - Algoritmo que cruza o preço de mercado com o preço-alvo e a margem definida pelo usuário. Caso a condição (Preço Atual <= Preço Alvo) seja atingida, o fluxo gera uma notificação personalizada.
5. **Notificação Automática (`Send a message`)**:
   - Disparo de e-mail via Gmail confirmando que o preço desejado foi atingido.
6. **Atualização de Status (`Delete a row`)**:
   - Deletar os alertas que foram disparados 

## 👥 Equipe e Colaboração
As funcionalidades são desenvolvidas pelos colaboradores via branches `feature/` para garantir a integridade da `main` sincronizada com o Lovable. 
