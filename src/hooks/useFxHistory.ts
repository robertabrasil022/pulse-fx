import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface HistoricalRate {
  date: string;
  bid: number;
  ask: number;
  high: number;
  low: number;
  pctChange: number;
  variance: number;
}

export interface CurrencyHistory {
  currency: string;
  data: HistoricalRate[];
}

async function fetchFxHistory(currencies: string[], days: number): Promise<CurrencyHistory[]> {
  const { data, error } = await supabase.functions.invoke('fetch-fx-history', {
    body: { currencies, days },
  });

  if (error) throw new Error(error.message || 'Erro ao buscar histórico');
  if (data?.error) throw new Error(data.error);

  return data.results as CurrencyHistory[];
}

export function useFxHistory(currencies: string[], days: number) {
  return useQuery({
    queryKey: ['fx-history', currencies.sort().join(','), days],
    queryFn: () => fetchFxHistory(currencies, days),
    enabled: currencies.length > 0,
    staleTime: 5 * 60 * 1000, // 5 min cache
    refetchOnWindowFocus: false,
  });
}
