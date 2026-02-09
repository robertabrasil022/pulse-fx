import { useQuery } from '@tanstack/react-query';
import { fetchFxRates, fetchFxInsights } from '@/repositories/fxRatesRepository';
import { fetchCommoditySettings } from '@/repositories/commodityRepository';
import { FxRate, FxInsight, CommoditySetting } from '@/types/database';

export function useFxRates() {
  return useQuery({
    queryKey: ['fx-rates'],
    queryFn: () => fetchFxRates(),
    refetchInterval: 30000,
  });
}

export function useFxInsights() {
  return useQuery({
    queryKey: ['fx-insights'],
    queryFn: () => fetchFxInsights(),
  });
}

export function useCommoditySettings(userId?: string) {
  return useQuery({
    queryKey: ['commodity-settings', userId],
    queryFn: () => fetchCommoditySettings(userId!),
    enabled: !!userId,
  });
}
