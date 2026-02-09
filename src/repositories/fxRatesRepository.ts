import { externalSupabase } from './externalClient';
import { FxRate, FxInsight } from '@/types/database';

export async function fetchFxRates(limit = 50): Promise<FxRate[]> {
  const { data, error } = await externalSupabase
    .from('fx_rates')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as FxRate[];
}

export async function fetchFxInsights(limit = 10): Promise<FxInsight[]> {
  const { data, error } = await externalSupabase
    .from('fx_insights')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as unknown as FxInsight[];
}

export async function invokeGenerateInsights(rates: FxRate[]) {
  const { data, error } = await externalSupabase.functions.invoke(
    'generate-fx-insights',
    { body: { rates } }
  );

  if (error) throw new Error(error.message || 'Erro ao gerar insights');
  if (data?.error) throw new Error(data.error);

  return data;
}
