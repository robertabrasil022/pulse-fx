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

## 👥 Equipe e Colaboração
As funcionalidades são desenvolvidas pelos colaboradores via branches `feature/` para garantir a integridade da `main` sincronizada com o Lovable. 
