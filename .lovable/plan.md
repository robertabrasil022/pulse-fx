

# Plano: Desacoplar a Camada de Dados (Repository Pattern)

## Objetivo

Criar uma camada de abstração entre os componentes/hooks e o banco de dados, permitindo trocar a implementação (Supabase direto, API externa, mock, etc.) sem alterar o restante do código.

## Arquitetura Proposta

A ideia e introduzir um padrao **Repository** -- um conjunto de funcoes que encapsulam todas as operacoes de dados. Os hooks continuam existindo (para integrar com React Query), mas delegam ao repositorio.

```text
+-----------------+     +------------------+     +---------------------+
|  Componentes    | --> |  Hooks (React    | --> |  Repositorio        |
|  (Dashboard,    |     |  Query + estado) |     |  (fxRatesRepo,     |
|   Alerts, etc.) |     |                  |     |   preferencesRepo,  |
+-----------------+     +------------------+     |   commodityRepo,    |
                                                  |   authRepo)         |
                                                  +----------+----------+
                                                             |
                                                  +----------v----------+
                                                  |  Implementacao      |
                                                  |  Supabase (atual)   |
                                                  |  -- ou --           |
                                                  |  API Externa        |
                                                  +---------------------+
```

## O que muda

### 1. Criar `src/repositories/` com modulos por dominio

Cada arquivo exporta funcoes puras (sem React) que encapsulam as chamadas ao Supabase:

- **`src/repositories/fxRatesRepository.ts`** -- `fetchRates()`, `fetchInsights()`
- **`src/repositories/commodityRepository.ts`** -- `fetchSettings(userId)`, `createSetting(data)`, `deleteSetting(id)`
- **`src/repositories/preferencesRepository.ts`** -- `fetchPreferences(userId)`, `createDefaults(userId)`, `updatePreferences(userId, updates)`
- **`src/repositories/authRepository.ts`** -- `signIn()`, `signUp()`, `signOut()`, `getSession()`, `onAuthStateChange()`

### 2. Atualizar os hooks para usar os repositorios

Os hooks (`useDashboardData`, `usePreferences`, `useAuth`, `useAIInsights`) passam a chamar as funcoes do repositorio em vez de usar `supabase` diretamente.

### 3. Remover chamadas diretas ao Supabase nas paginas

A pagina `Alerts.tsx` hoje faz `supabase.from('commodity_settings').insert(...)` e `.delete(...)` diretamente. Essas chamadas serao movidas para o repositorio e expostas via um novo hook `useCommodityMutations()`.

### 4. Nenhuma mudanca visual

A interface permanece identica. Apenas a organizacao interna do codigo muda.

## Arquivos a criar

| Arquivo | Responsabilidade |
|---------|-----------------|
| `src/repositories/fxRatesRepository.ts` | Buscar cotacoes e insights |
| `src/repositories/commodityRepository.ts` | CRUD de alertas de commodities |
| `src/repositories/preferencesRepository.ts` | CRUD de preferencias do usuario |
| `src/repositories/authRepository.ts` | Autenticacao (login, registro, sessao) |

## Arquivos a modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/hooks/useDashboardData.ts` | Importar do repositorio em vez de `supabase` |
| `src/hooks/usePreferences.ts` | Importar do repositorio em vez de `supabase` |
| `src/hooks/useAuth.tsx` | Importar do repositorio em vez de `supabase` |
| `src/hooks/useAIInsights.ts` | Importar do repositorio em vez de `supabase` |
| `src/pages/Alerts.tsx` | Remover `import { supabase }`, usar hook/repositorio |

## Exemplo de como fica

**Repositorio** (`src/repositories/fxRatesRepository.ts`):
```typescript
import { supabase } from '@/integrations/supabase/client';
import { FxRate } from '@/types/database';

export async function fetchFxRates(limit = 50): Promise<FxRate[]> {
  const { data, error } = await supabase
    .from('fx_rates')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as FxRate[];
}
```

**Hook** (`src/hooks/useDashboardData.ts`):
```typescript
import { useQuery } from '@tanstack/react-query';
import { fetchFxRates } from '@/repositories/fxRatesRepository';

export function useFxRates() {
  return useQuery({
    queryKey: ['fx-rates'],
    queryFn: () => fetchFxRates(),
    refetchInterval: 30000,
  });
}
```

## Beneficio

Para trocar para uma API externa no futuro, basta alterar a implementacao dentro de cada arquivo em `src/repositories/` -- nenhum hook ou componente precisa ser modificado.

