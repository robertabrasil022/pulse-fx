

# Plano: Integrar AwesomeAPI + API de Commodities ao Dashboard

## Situacao Atual

O dashboard lê dados das tabelas `fx_rates` e `fx_insights` no seu Supabase externo, mas **nenhuma API externa alimenta essas tabelas** -- por isso estão vazias e o dashboard não mostra dados.

## O que sera feito

Criar uma Edge Function que busca cotacoes da **AwesomeAPI** (cambio) e de uma **API de commodities**, salva os dados na tabela `fx_rates` do seu Supabase externo, e agendar um cron para rodar a cada 30 minutos.

## Fontes de Dados

1. **AwesomeAPI** (gratuita, sem chave): `https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL,CNY-BRL,GBP-BRL,JPY-BRL,ARS-BRL,AUD-BRL,RUB-BRL,INR-BRL`
2. **Commodities**: Usaremos a AwesomeAPI tambem para commodities disponiveis (ouro, prata, bitcoin via `https://economia.awesomeapi.com.br/json/last/XAU,XAG,BTC`), mapeando para os nomes do sistema (Graos, Cafe, Soja, etc. sao precificados via proxy de cambio). Se voce tiver uma API especifica de commodities agricolas, podemos integrar depois.

## Etapas

### 1. Edge Function `fetch-fx-rates`

Nova funcao em `supabase/functions/fetch-fx-rates/index.ts` que:

- Chama a AwesomeAPI para as 9 moedas configuradas
- Parseia a resposta (bid, ask, pctChange, timestamp)
- Insere os dados na tabela `fx_rates` do Supabase externo usando a service role key (ou anon key com politica INSERT)
- Retorna sucesso/erro

### 2. Ajustar politica RLS da tabela `fx_rates`

Atualmente a tabela `fx_rates` no seu Supabase externo so permite SELECT. Precisamos de uma forma de inserir dados. Duas opcoes:

- **Opcao A**: A Edge Function roda no Lovable Cloud e usa a anon key do seu Supabase externo. Voce precisara adicionar uma politica INSERT na tabela `fx_rates` no seu Supabase externo (ou usar a service role key como secret).
- **Opcao B** (recomendada): Armazenar a **service role key** do seu Supabase externo como secret no Lovable Cloud, e usar na Edge Function para inserir dados sem restricao RLS.

### 3. Cron Job (a cada 30 minutos)

Configurar um cron no Lovable Cloud que chama a Edge Function `fetch-fx-rates` a cada 30 minutos via `pg_cron` + `pg_net`.

### 4. Ajuste no frontend (opcional)

O frontend ja funciona -- ele le de `fx_rates` via `externalSupabase`. Uma vez que a tabela tenha dados, o dashboard exibira tudo automaticamente.

---

## Detalhes Tecnicos

### Edge Function `fetch-fx-rates/index.ts`

```text
1. Recebe requisicao (POST do cron ou manual)
2. Chama AwesomeAPI: GET https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL,...
3. Para cada par retornado:
   - Extrai bid, ask, pctChange, timestamp
   - Monta objeto { code: "USD/BRL", bid_value, ask_value, pct_change, timestamp }
4. Conecta ao Supabase externo (usando EXTERNAL_SUPABASE_URL + service role key)
5. INSERT batch na tabela fx_rates
6. Retorna { inserted: N, errors: [] }
```

### Secret necessario

- `EXTERNAL_SUPABASE_SERVICE_ROLE_KEY` -- a service role key do seu projeto externo (para inserir dados sem RLS). Sera solicitada antes da implementacao.

### SQL do Cron (executado no Lovable Cloud)

```text
Habilitar extensoes pg_cron e pg_net
Agendar chamada HTTP POST para a Edge Function a cada 30 minutos
```

### Mapeamento AwesomeAPI -> fx_rates

| AwesomeAPI code | fx_rates.code |
|-----------------|---------------|
| USDBRL          | USD/BRL       |
| EURBRL          | EUR/BRL       |
| CNYBRL          | CNY/BRL       |
| GBPBRL          | GBP/BRL       |
| JPYBRL          | JPY/BRL       |
| ARSBRL          | ARS/BRL       |
| AUDBRL          | AUD/BRL       |
| RUBBRL          | RUB/BRL       |
| INRBRL          | INR/BRL       |

## Sequencia de Implementacao

1. Solicitar a service role key do Supabase externo
2. Criar a Edge Function `fetch-fx-rates`
3. Testar a funcao manualmente
4. Configurar o cron job de 30 minutos
5. Verificar dados no dashboard

